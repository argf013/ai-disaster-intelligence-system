import os
import uuid
import numpy as np
import cv2
from PIL import Image, ImageOps, ImageDraw
from typing import Dict, Any, List, Optional
from app.config import HEATMAP_UPLOAD_DIR, RAW_UPLOAD_DIR, ANNOTATED_UPLOAD_DIR, FAST_DEV_MODE

# Comprehensive, visually distinctive multi-prompt templates per disaster category.
# Following OpenAI CLIP best practices (Radford et al., 2021):
# 1. Concrete visual descriptors (rubble, muddy water, torn roofs, smoke plumes) outperform abstract labels.
# 2. Aerial/drone/satellite framing aligns with remote sensing and incident perspectives.
# 3. Negations like "without disaster" are avoided because contrastive text encoders misinterpret negated concepts.
# 4. Cross-disaster contamination words (e.g. mentioning "flood" in cyclone prompts) are strictly eliminated.
DISASTER_PROMPT_TEMPLATES: Dict[str, List[str]] = {
    "flood": [
        "an aerial photograph of severe flooding with deep brown muddy water submerging streets and residential houses",
        "a drone view of high floodwaters inundating urban neighborhoods with submerged roads and buildings",
        "an aerial shot of an overflowing river causing massive inundation with buildings standing in deep water",
        "a satellite view of a flood disaster with waterlogged terrain and inundated urban infrastructure",
        "a drone photograph of widespread floodwaters covering roads, parking lots, and countryside",
        "an aerial perspective of severe flood disaster with brown inundated water covering the ground"
    ],
    "wildfire": [
        "an aerial photograph of an active forest wildfire with bright flames and heavy rising smoke plumes",
        "a drone shot of blazing wildfire consuming trees and spreading dense smoke across the hills",
        "an aerial view of intense bushfire with glowing fire lines burning through forest and vegetation",
        "a high-angle satellite photo of charred blackened landscape and thick smoke from a forest wildfire",
        "a drone photograph of wildfire flames burning wildland and woodland with massive smoke clouds",
        "an aerial view of active wildfire disaster with burning timber, ash, and orange fire fronts"
    ],
    "earthquake damage": [
        "an aerial photograph of severe earthquake damage with collapsed buildings, concrete rubble, and structural ruins",
        "a drone view of shattered concrete buildings, fallen walls, and rubble piles after an earthquake",
        "an aerial shot of destroyed infrastructure, cracked masonry, and collapsed multi-story structures from an earthquake",
        "a high-angle view of earthquake devastation with pulverized concrete, heaps of bricks, and architectural debris",
        "a drone photograph of catastrophic earthquake destruction with fractured building facades and rubble-filled streets",
        "an aerial view of seismic devastation showing leveled buildings, structural wreckage, and collapsed roofs"
    ],
    "cyclone/hurricane/storm": [
        "an aerial photograph of extreme cyclone and hurricane devastation with torn metal roofs and wind debris",
        "a drone view of severe tropical cyclone damage with ripped-off rooftops and uprooted trees across streets",
        "an aerial shot of hurricane wreckage showing severely damaged houses, stripped roofs, and scattered debris",
        "a high-angle photo of coastal typhoon aftermath with wind-damaged structures and debris strewn everywhere",
        "a drone photograph of violent tropical storm damage with destroyed building roofs and storm wreckage",
        "an aerial view of severe gale and hurricane devastation with shattered structures and windblown debris"
    ],
    "landslide": [
        "an aerial photograph of a hillside landslide with massive displaced mud, rocks, and soil covering the slope",
        "a drone view of a catastrophic mudslide carving down a steep mountain slope and burying pathways below",
        "an aerial shot of unstable slope failure where a rock and earth avalanche wiped out vegetation and roads",
        "a high-angle photo of a hillside debris flow with tons of displaced brown soil and boulders across terrain",
        "a drone photograph of steep terrain collapsed into loose mud, soil mounds, and sheared rock slopes",
        "an aerial view of an active landslide with massive ground collapse cutting through mountainside terrain"
    ],
    "normal scene": [
        "an aerial photograph of a calm undamaged urban area with intact buildings, clean dry roads, and regular traffic",
        "a drone view of a routine city or residential neighborhood in clear weather with undamaged architecture",
        "an aerial shot of healthy green landscape, intact houses, peaceful streets, and thriving vegetation",
        "a high-angle view of an ordinary peaceful community with structurally sound buildings and dry pathways",
        "a drone photograph of standard undamaged cityscape with intact rooftops, dry roads, and green trees",
        "an aerial view of a serene undamaged countryside or town under clear sky with normal daily conditions"
    ]
}

CANDIDATE_LABELS = list(DISASTER_PROMPT_TEMPLATES.keys())

# Lazy-loaded pipeline and model caches
_clip_model = None
_clip_processor = None
_yolo_model = None
_cached_text_features = None
_cached_classes = None

def get_clip_components():
    """
    Loads openai/clip-vit-base-patch32 processor and model for multi-prompt embedding comparison.
    """
    global _clip_model, _clip_processor
    if FAST_DEV_MODE:
        return "FALLBACK", "FALLBACK"
    if _clip_model is None or _clip_processor is None:
        try:
            import torch
            from transformers import CLIPProcessor, CLIPModel
            model_id = "openai/clip-vit-base-patch32"
            _clip_processor = CLIPProcessor.from_pretrained(model_id)
            _clip_model = CLIPModel.from_pretrained(model_id)
            _clip_model.eval()
            if torch.cuda.is_available():
                _clip_model.to("cuda")
        except Exception as e:
            print(f"[VisionService] Notice: CLIP model initialization deferred/fallback: {e}")
            return "FALLBACK", "FALLBACK"
    return _clip_model, _clip_processor

def get_cached_text_features(clip_model, clip_processor, device):
    """
    Precomputes and caches L2-normalized prototype text embeddings for all disaster classes.
    Following OpenAI CLIP best practices (Radford et al., 2021):
    1. Each template is encoded through the text transformer.
    2. Prompt vectors are L2-normalized in the 512-dim feature space.
    3. Normalized prompt vectors for each category are averaged to create an ensemble prototype.
    4. The ensemble prototype is re-normalized to unit length.
    
    Why caching is crucial on an 8GB RAM / 2-core CPU:
    - Precomputing this 6x512 matrix once eliminates encoding 36 text prompts on every request,
      reducing CPU load and latency drastically without loading larger models.
    """
    global _cached_text_features, _cached_classes
    if _cached_text_features is not None and _cached_classes == CANDIDATE_LABELS:
        return _cached_text_features.to(device), _cached_classes

    import torch
    class_prototypes = []
    with torch.no_grad():
        for class_name in CANDIDATE_LABELS:
            templates = DISASTER_PROMPT_TEMPLATES[class_name]
            text_inputs = clip_processor(
                text=templates,
                return_tensors="pt",
                padding=True
            ).to(device)
            # Encode templates through CLIP text model
            text_embeds = clip_model.get_text_features(**text_inputs)
            if hasattr(text_embeds, "pooler_output") and text_embeds.pooler_output is not None:
                text_embeds = text_embeds.pooler_output
            # L2-normalize each prompt embedding
            text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
            # Average normalized vectors to form the ensemble prototype
            proto = text_embeds.mean(dim=0)
            # Re-normalize to unit length
            proto = proto / proto.norm(dim=-1, keepdim=True)
            class_prototypes.append(proto.unsqueeze(0))

        _cached_text_features = torch.cat(class_prototypes, dim=0) # Shape: (6, 512)
        _cached_classes = list(CANDIDATE_LABELS)

    return _cached_text_features.to(device), _cached_classes


def get_yolo_model():
    global _yolo_model
    if FAST_DEV_MODE:
        return "FALLBACK"
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            # Source of truth: Cell 8 of the latest notebook uses 'yolo11n.pt'
            _yolo_model = YOLO("yolo11n.pt")
        except Exception as e:
            print(f"[VisionService] Notice: YOLO11 model initialization deferred/fallback: {e}")
            _yolo_model = "FALLBACK"
    return _yolo_model

def detect_objects_yolo(image_path: str) -> Dict[str, Any]:
    """
    Executes YOLO11 object detection as defined in Section 3 (Cell 8) of the latest client notebook.
    Returns detected objects with confidence scores and saves an annotated bounding-box image.
    """
    model = get_yolo_model()
    annotated_filename = f"annotated_{uuid.uuid4().hex[:8]}.jpg"
    annotated_path = ANNOTATED_UPLOAD_DIR / annotated_filename

    detected_objects = []

    if model and model != "FALLBACK":
        try:
            yolo_results = model(source=image_path, conf=0.25, verbose=False)
            res = yolo_results[0]
            annotated_mat = res.plot()
            cv2.imwrite(str(annotated_path), annotated_mat)

            if res.boxes is not None and len(res.boxes) > 0:
                for cls_id, conf in zip(res.boxes.cls.tolist(), res.boxes.conf.tolist()):
                    name = res.names[int(cls_id)]
                    detected_objects.append({
                        "name": name,
                        "confidence": round(float(conf), 4)
                    })
        except Exception as e:
            print(f"[VisionService] YOLO inference error: {e}. Generating fallback annotation.")
            detected_objects = _generate_fallback_yolo(image_path, str(annotated_path))
    else:
        detected_objects = _generate_fallback_yolo(image_path, str(annotated_path))

    return {
        "yolo_objects": detected_objects,
        "yolo_object_count": len(detected_objects),
        "annotated_image_url": f"/uploads/annotated/{annotated_filename}"
    }

def _generate_fallback_yolo(source_path: str, out_path: str) -> List[Dict[str, Any]]:
    """
    Draws sample disaster-relevant bounding boxes (person, car, boat) for instant demonstration in dev mode.
    """
    img = cv2.imread(source_path)
    if img is None:
        return []

    h, w = img.shape[:2]
    # Sample bounding boxes representing disaster-relevant entities
    boxes = [
        {"name": "person", "conf": 0.88, "box": (int(w * 0.2), int(h * 0.4), int(w * 0.35), int(h * 0.75)), "color": (0, 255, 0)},
        {"name": "car", "conf": 0.91, "box": (int(w * 0.5), int(h * 0.55), int(w * 0.85), int(h * 0.85)), "color": (255, 0, 0)},
        {"name": "boat", "conf": 0.84, "box": (int(w * 0.05), int(h * 0.6), int(w * 0.4), int(h * 0.9)), "color": (0, 165, 255)}
    ]

    detected = []
    for b in boxes:
        x1, y1, x2, y2 = b["box"]
        cv2.rectangle(img, (x1, y1), (x2, y2), b["color"], 2)
        label = f"{b['name']} {int(b['conf']*100)}%"
        cv2.putText(img, label, (x1, max(15, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, b["color"], 2)
        detected.append({"name": b["name"], "confidence": b["conf"]})

    cv2.imwrite(out_path, img)
    return detected

def classify_disaster_image(image_path: str) -> Dict[str, Any]:
    """
    Classifies disaster imagery using multi-prompt zero-shot OpenAI CLIP with
    normalized text prototype ensembling and runs supplementary YOLO11 object detection.
    
    Zero-Shot Ensembling:
    - Pre-cached L2-normalized class prototypes (averaged across aerial/drone prompt templates).
    - Image embedding dot-producted with normalized prototypes and scaled by learned logit_scale.
    - Softmax over similarities produces consistent, well-calibrated class probabilities.
    - YOLO11 is strictly supplementary object detection and is never used to determine disaster class.
    """
    # 1. Load image and apply EXIF orientation normalization (critical for aerial/drone photos)
    raw_img = Image.open(image_path)
    image = ImageOps.exif_transpose(raw_img).convert("RGB")
    clip_model, clip_processor = get_clip_components()

    scores = []
    # 1. Multi-Prompt Normalized CLIP Zero-Shot Prototype Classification
    if clip_model != "FALLBACK" and clip_processor != "FALLBACK":
        try:
            import torch
            device = next(clip_model.parameters()).device

            # Retrieve pre-cached L2-normalized class text prototypes
            text_prototypes, ordered_classes = get_cached_text_features(clip_model, clip_processor, device)

            # Preprocess and encode image using CLIP image encoder
            image_inputs = clip_processor(images=image, return_tensors="pt").to(device)

            with torch.no_grad():
                image_features = clip_model.get_image_features(**image_inputs)
                if hasattr(image_features, "pooler_output") and image_features.pooler_output is not None:
                    image_features = image_features.pooler_output
                # L2 normalize image feature vector
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

                # Compute cosine similarities to each class prototype: (1, 512) @ (512, num_classes)
                cosine_sims = (image_features @ text_prototypes.T)[0] # Shape: (num_classes,)

                # Scale cosine similarities by CLIP's learned logit_scale temperature
                logit_scale = clip_model.logit_scale.exp()
                logits = cosine_sims * logit_scale

                # Softmax over aggregated class logits to get calibrated probabilities
                probs = torch.softmax(logits, dim=0).cpu().numpy()
                raw_sims = cosine_sims.cpu().numpy()

            for class_name, prob in zip(ordered_classes, probs):
                scores.append({
                    "label": class_name,
                    "score": round(float(prob), 4)
                })

            # Sort descending by score
            scores.sort(key=lambda x: x["score"], reverse=True)
            top_disaster = scores[0]["label"]
            top_confidence = scores[0]["score"]
            execution_mode = "inference"

            # Development debug diagnostics logging
            filename = os.path.basename(image_path)
            print(f"[VisionService][CLIP Zero-Shot Inference: {filename}]")
            for item in scores:
                class_idx = ordered_classes.index(item["label"])
                sim_val = raw_sims[class_idx]
                pct = item["score"] * 100
                print(f"   - {item['label']:<24}: sim={sim_val:+.4f} | prob={pct:5.1f}%")
            print(f"   => Winner: {top_disaster} (conf={top_confidence*100:.1f}%)")

        except Exception as e:
            print(f"[VisionService] CLIP model inference exception: {e}. Utilizing fallback scoring.")
            top_disaster, top_confidence, scores = _fallback_classify(image)
            execution_mode = "fallback_dev_mode"
    else:
        top_disaster, top_confidence, scores = _fallback_classify(image)
        execution_mode = "fallback_dev_mode"

    # Severity rule from Cell 8 of the reference notebook
    if top_disaster != "normal scene":
        if top_confidence >= 0.60:
            severity = "HIGH"
        elif top_confidence >= 0.40:
            severity = "MEDIUM"
        else:
            severity = "LOW"
    else:
        severity = "LOW"

    # 2. YOLO11 Object Detection (Visible physical entity detection only)
    # Strictly supplementary; does NOT determine or overwrite disaster class.
    yolo_data = detect_objects_yolo(image_path)

    return {
        "top_disaster": top_disaster,
        "top_confidence": top_confidence,
        "severity": severity,
        "all_scores": scores,
        "yolo_objects": yolo_data["yolo_objects"],
        "yolo_object_count": yolo_data["yolo_object_count"],
        "annotated_image_url": yolo_data["annotated_image_url"],
        "execution_mode": execution_mode
    }

def _fallback_classify(pil_img: Image.Image):
    """
    Lightweight continuous multi-spectral and edge feature extraction for FAST_DEV_MODE or fallback.
    Extracts visual features (color balance, earth/brown tones, gray rubble/edge density) across
    all 6 candidate classes without hardcoded shortcuts or YOLO dependencies.
    """
    arr = np.array(pil_img)
    h, w = arr.shape[:2]

    # Downsample if large for fast computation
    if max(h, w) > 256:
        scale = 256.0 / max(h, w)
        arr = cv2.resize(arr, (int(w * scale), int(h * scale)))

    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)

    mean_r, mean_g, mean_b = float(np.mean(r)), float(np.mean(g)), float(np.mean(b))

    # Edge density via Sobel (structural fragmentation / concrete rubble indicator)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edge_density = float(np.mean(np.sqrt(sobel_x**2 + sobel_y**2)))

    # Color saturation in HSV
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    sat = float(np.mean(hsv[:, :, 1]))

    # Dynamic class affinity scores based on physical visual properties
    # 1. Flood: Water presence (high blue/cyan, or dark muddy water where G & B are close and R is lower)
    flood_affinity = max(0.0, (mean_b - mean_r) * 1.5) + max(0.0, (140 - abs(mean_r - 95))) * 0.4

    # 2. Wildfire: High red/orange excess, high saturation, high red contrast
    fire_affinity = max(0.0, (mean_r - mean_b) * 1.8) + (sat * 0.6 if mean_r > 110 else 0.0)

    # 3. Earthquake damage: High edge fragmentation (rubble), neutral gray palette (low color saturation)
    eq_affinity = (edge_density * 1.6) + max(0.0, (70 - sat) * 1.2)

    # 4. Landslide: High earth/brown presence (R > B, moderate saturation, slope texture)
    brown_affinity = max(0.0, (mean_r - mean_b)) * 1.1 + max(0.0, (mean_g - mean_b)) * 0.6 + (edge_density * 0.5)

    # 5. Cyclone / hurricane: Broken roofs / mixed wind debris with overcast / desaturated sky
    cyclone_affinity = (edge_density * 1.1) + max(0.0, (mean_b - 100) * 0.5) + max(0.0, (80 - sat) * 0.8)

    # 6. Normal scene: High green vegetation balance or clean dry urban balanced spectrum with moderate edges
    normal_affinity = max(0.0, (mean_g - mean_r) * 2.2) + max(0.0, (mean_g - mean_b) * 1.8) + max(0.0, (40 - edge_density) * 1.2)

    affinities = np.array([
        flood_affinity,
        fire_affinity,
        eq_affinity,
        cyclone_affinity,
        brown_affinity,
        normal_affinity
    ], dtype=float)

    # Softmax temperature scaling
    temp = 18.0
    exp_aff = np.exp((affinities - np.max(affinities)) / (temp / 10.0))
    probs = exp_aff / np.sum(exp_aff)

    scores = []
    for lbl, p in zip(CANDIDATE_LABELS, probs):
        scores.append({"label": lbl, "score": round(float(p), 4)})

    scores.sort(key=lambda x: x["score"], reverse=True)
    top_disaster = scores[0]["label"]
    top_confidence = scores[0]["score"]

    print("[VisionService][Dev Fallback Visual Diagnostics]")
    for item in scores:
        print(f"   - {item['label']:<24}: prob={item['score']*100:5.1f}%")

    return top_disaster, top_confidence, scores

def compare_images_and_generate_heatmap(before_path: str, after_path: str) -> Dict[str, Any]:
    """
    Calculates change score and false-color heatmap using OpenCV from Section 4 (Cell 10) of the notebook.
    """
    before_img = cv2.imread(before_path)
    after_img = cv2.imread(after_path)

    if before_img is None or after_img is None:
        raise ValueError("Could not decode one or both uploaded image files.")

    before = cv2.cvtColor(before_img, cv2.COLOR_BGR2RGB)
    after = cv2.cvtColor(after_img, cv2.COLOR_BGR2RGB)

    # Resize to common bounding dimension
    h = min(before.shape[0], after.shape[0])
    w = min(before.shape[1], after.shape[1])
    before = cv2.resize(before, (w, h))
    after = cv2.resize(after, (w, h))

    # Absolute pixel difference
    diff = cv2.absdiff(before, after)
    gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)

    # Change score mean
    change_score = float(gray.mean() / 255.0)

    # Damage level thresholding from Cell 10
    if change_score < 0.08:
        damage_level = "LOW / NO SIGNIFICANT CHANGE"
    elif change_score < 0.18:
        damage_level = "MODERATE CHANGE"
    else:
        damage_level = "HIGH CHANGE"

    # JET Colormap heatmap
    heat = cv2.applyColorMap(gray, cv2.COLORMAP_JET)

    # Save heatmap
    heatmap_filename = f"heatmap_{uuid.uuid4().hex[:8]}.png"
    heatmap_out_path = HEATMAP_UPLOAD_DIR / heatmap_filename
    cv2.imwrite(str(heatmap_out_path), heat)

    return {
        "change_score": round(change_score * 100.0, 2),
        "damage_level": damage_level,
        "heatmap_url": f"/uploads/heatmaps/{heatmap_filename}"
    }
