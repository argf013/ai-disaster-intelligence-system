import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import ThreatBadge from '../components/ThreatBadge';
import LeafletMap from '../components/LeafletMap';
import {
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Home,
  Save,
  FileText,
  MapPin,
  RefreshCw,
  BellRing,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Crosshair,
  X,
  Sparkles,
  MessageSquareWarning,
} from 'lucide-react';

export const DashboardView = ({
  onNavigateToReports,
  onNavigateToShelters,
  assessmentContext = {},
  onClearContextItem,
  currentLocation,
  setCurrentLocation,
}) => {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(
    currentLocation?.name || 'Hyderabad (Flood Zone)'
  );
  const [locationName, setLocationName] = useState(
    currentLocation?.name || 'Hyderabad (Flood Zone)'
  );
  const [latitude, setLatitude] = useState(currentLocation?.latitude || 17.3850);
  const [longitude, setLongitude] = useState(currentLocation?.longitude || 78.4867);

  // Telemetry & Computed State
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState(null);
  const [shelterResult, setShelterResult] = useState(null);
  const [sheltersList, setSheltersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState([]);

  // Fetch presets on load
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await apiClient.get('/weather/presets');
        setPresets(res.data);
        if (currentLocation?.name) {
          setSelectedPreset(currentLocation.name);
        } else if (res.data.length > 0) {
          setSelectedPreset(res.data[0].name);
        }
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    };
    fetchPresets();
    fetchRecentAssessments();
  }, []);

  // Sync if currentLocation changes from outside
  useEffect(() => {
    if (currentLocation && currentLocation.name) {
      setSelectedPreset(currentLocation.name);
      setLocationName(currentLocation.name);
      setLatitude(currentLocation.latitude);
      setLongitude(currentLocation.longitude);
      runAssessment(currentLocation.latitude, currentLocation.longitude, currentLocation.name);
    }
  }, [currentLocation]);

  // Fetch recent assessments
  const fetchRecentAssessments = async () => {
    try {
      const res = await apiClient.get('/assessments/history');
      setRecentAssessments(res.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  // Run assessment pipeline whenever coordinates change
  const runAssessment = async (lat, lon, name) => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      // 1. Live Weather from Open-Meteo
      const weatherRes = await apiClient.get(`/weather/live?lat=${lat}&lon=${lon}`);
      setWeather(weatherRes.data);

      // 2. Risk Evaluation
      const riskRes = await apiClient.post('/risk/evaluate', weatherRes.data);
      setRisk(riskRes.data);

      // 3. Nearest Shelter & All Shelters
      const [shelterRes, allSheltersRes] = await Promise.all([
        apiClient.get(`/gis/nearest?lat=${lat}&lon=${lon}`),
        apiClient.get('/gis/shelters'),
      ]);
      setShelterResult(shelterRes.data);
      setSheltersList(allSheltersRes.data);
    } catch (err) {
      console.error('Assessment pipeline error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentLocation) {
      runAssessment(latitude, longitude, locationName);
    }
  }, []);

  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const found = presets.find((p) => p.name === presetName);
    if (found) {
      setLocationName(found.name);
      setLatitude(found.latitude);
      setLongitude(found.longitude);
      if (setCurrentLocation) {
        setCurrentLocation(found);
      }
      runAssessment(found.latitude, found.longitude, found.name);
    }
  };

  // Minimal deterministic overall severity rule combining independent model signals:
  // - XGBoost: risk_level ('LOW' | 'MEDIUM' | 'HIGH')
  // - CLIP: image_severity ('LOW' | 'MEDIUM' | 'HIGH')
  // - OpenCV: damage_level ('LOW / NO SIGNIFICANT CHANGE' | 'MODERATE CHANGE' | 'HIGH CHANGE', 'HEAVY', 'EXTREME', etc.)
  // - BART: emergency_urgency ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'), classification ('people trapped', 'medical emergency', etc.)
  const computeOverallSeverity = () => {
    const xgbLevel = risk?.risk_level || 'LOW';
    const clipLevel = assessmentContext.vision?.image_severity || 'LOW';
    const damageLevel = assessmentContext.damage?.damage_level || '';
    const nlpUrgency = assessmentContext.emergency?.urgency_level || 'LOW';
    const nlpCategory = assessmentContext.emergency?.classification || '';

    // 1. CRITICAL: Strictly reserved for immediate life-safety emergencies:
    // - BART triage evaluates immediate acute life threat (CRITICAL)
    // - OR BART triage is HIGH and specifically in an acute life-safety category ('people trapped' or 'medical emergency')
    if (
      nlpUrgency === 'CRITICAL' ||
      (nlpUrgency === 'HIGH' && (nlpCategory === 'people trapped' || nlpCategory === 'medical emergency'))
    ) {
      return 'CRITICAL';
    }

    // 2. HIGH: Serious disaster condition, extreme physical hazard, or evacuation advisory
    // Multiple HIGH environmental signals (e.g. XGBoost + CLIP + Damage) reinforce HIGH, not CRITICAL
    const isDamageHigh =
      damageLevel.includes('HIGH') ||
      damageLevel.includes('HEAVY') ||
      damageLevel.includes('EXTREME');

    if (
      xgbLevel === 'HIGH' ||
      clipLevel === 'HIGH' ||
      isDamageHigh ||
      nlpUrgency === 'HIGH'
    ) {
      return 'HIGH';
    }

    // 3. MEDIUM: Localized disruption or moderate warning
    if (
      xgbLevel === 'MEDIUM' ||
      clipLevel === 'MEDIUM' ||
      damageLevel.includes('MODERATE') ||
      nlpUrgency === 'MEDIUM'
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  };

  const overallSeverity = computeOverallSeverity();

  const handleSaveAssessment = async () => {
    if (!risk) return;
    setSaving(true);
    try {
      await apiClient.post('/assessments/save', {
        location_name: locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        weather_temperature: weather?.temperature,
        weather_humidity: weather?.humidity,
        weather_rainfall: weather?.rainfall,
        weather_wind_speed: weather?.wind_speed,
        risk_score: risk.risk_score,
        risk_level: overallSeverity,
        detected_disaster: assessmentContext.vision?.disaster_type || null,
        image_confidence: assessmentContext.vision?.image_confidence || null,
        image_severity: assessmentContext.vision?.image_severity || null,
        yolo_objects: assessmentContext.vision?.yolo_objects
          ? JSON.stringify(assessmentContext.vision.yolo_objects)
          : null,
        damage_change_score: assessmentContext.damage?.change_score || null,
        damage_level: assessmentContext.damage?.damage_level || null,
        heatmap_path: assessmentContext.damage?.heatmap_url || null,
        emergency_text: assessmentContext.emergency?.text || null,
        emergency_category: assessmentContext.emergency?.classification || null,
        emergency_urgency: assessmentContext.emergency?.urgency_level || null,
        emergency_confidence: assessmentContext.emergency?.confidence || null,
        nearest_shelter_id: shelterResult?.shelter?.id,
        shelter_distance_km: shelterResult?.distance_km,
      });
      setSaveSuccess(true);
      fetchRecentAssessments();
    } catch (err) {
      console.error('Failed to save assessment', err);
    } finally {
      setSaving(false);
    }
  };

  // Always show disaster alert banner irrespective of model severity
  const showAlert = Boolean(shelterResult || risk || assessmentContext.vision);

  return (
    <div className="space-y-6">
      {/* Top Banner & Location Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operational Sector
              </span>
              {risk && <ThreatBadge level={risk.risk_level} size="sm" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              {locationName}
            </h1>
            <p className="text-xs text-slate-400">
              Coordinates: {Number(latitude).toFixed(4)}° N, {Number(longitude).toFixed(4)}° E
            </p>
          </div>

          {/* Location Presets & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Select Operational Sector
              </label>
              <select
                value={selectedPreset}
                onChange={handlePresetChange}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
              >
                {presets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runAssessment(latitude, longitude, locationName)}
              disabled={loading}
              className="mt-4 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </button>

            <button
              onClick={handleSaveAssessment}
              disabled={saving || !risk}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Saved to Audit' : saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>

        {/* DISASTER ALERT BANNER (Active Irrespective of Severity) */}
        {showAlert && (
          <div className="mt-4 p-4 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  URGENT: DISASTER ALERT DECLARED ({overallSeverity} LEVEL)
                </h4>
                <p className="text-xs text-red-200 mt-0.5">
                  Evacuate immediately toward primary refuge: <b>{shelterResult?.shelter?.name || 'Primary Municipal Shelter'}</b> (
                  {shelterResult?.distance_km} km away{shelterResult?.shelter?.address ? ` • ${shelterResult.shelter.address}` : ''}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-900 border border-red-500/40 rounded-full text-[11px] font-semibold text-white">
                <BellRing className="w-3.5 h-3.5 text-yellow-300" />
                Alert Broadcast Triggered
              </span>
            </div>
          </div>
        )}

        {/* Integrated Multi-Modal Intelligence Inputs (CLIP Vision, OpenCV Damage, & BART Emergency Triage) */}
        {(assessmentContext.vision || assessmentContext.damage || assessmentContext.emergency) && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Active Multi-Modal Incident Context Attached
              </span>
              <span className="text-[10px] text-slate-400">
                Combined with Meteorological Telemetry &amp; GIS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Vision Card */}
              {assessmentContext.vision && (
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        Aerial Vision (CLIP &amp; YOLO11)
                      </span>
                      <ThreatBadge level={assessmentContext.vision.image_severity} size="sm" />
                    </div>
                    <p className="text-sm font-bold text-white capitalize">
                      {assessmentContext.vision.disaster_type}
                      <span className="text-xs font-normal text-emerald-400 ml-1.5">
                        ({(assessmentContext.vision.image_confidence * 100).toFixed(1)}% conf)
                      </span>
                    </p>
                    {assessmentContext.vision.yolo_objects?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {assessmentContext.vision.yolo_objects.map((obj, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-cyan-300"
                          >
                            <Crosshair className="w-2.5 h-2.5" />
                            {obj.name} ({Math.round(obj.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {onClearContextItem && (
                    <button
                      type="button"
                      onClick={() => onClearContextItem('vision')}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Remove vision context"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Damage Card */}
              {assessmentContext.damage && (
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Surface Damage (OpenCV)
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {assessmentContext.damage.change_score}% Surface Delta
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-500/30">
                      {assessmentContext.damage.damage_level}
                    </span>
                  </div>
                  {onClearContextItem && (
                    <button
                      type="button"
                      onClick={() => onClearContextItem('damage')}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Remove damage context"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Emergency Dispatch Card (BART NLP) */}
              {assessmentContext.emergency && (
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <MessageSquareWarning className="w-3.5 h-3.5 text-rose-400" />
                        Citizen Triage (BART MNLI)
                      </span>
                      <ThreatBadge level={assessmentContext.emergency.urgency_level} size="sm" />
                    </div>
                    <p className="text-xs font-bold text-white capitalize">
                      {assessmentContext.emergency.classification}
                      <span className="text-[11px] font-normal text-emerald-400 ml-1.5">
                        ({Math.round(assessmentContext.emergency.confidence * 100)}% conf)
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/60 p-1.5 rounded border border-slate-700/50">
                      "{assessmentContext.emergency.text}"
                    </p>
                  </div>
                  {onClearContextItem && (
                    <button
                      type="button"
                      onClick={() => onClearContextItem('emergency')}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Remove emergency context"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Weather & Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rainfall */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Precipitation</span>
            <p className="text-xl font-bold text-white">
              {weather ? `${weather.rainfall} mm` : '...'}
            </p>
            <span className="text-[10px] text-slate-500">Live Open-Meteo Ingestion</span>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Wind Velocity</span>
            <p className="text-xl font-bold text-white">
              {weather ? `${weather.wind_speed} km/h` : '...'}
            </p>
            <span className="text-[10px] text-slate-500">Surface 10m Vector</span>
          </div>
        </div>

        {/* Temperature & Humidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Temp / Humidity</span>
            <p className="text-xl font-bold text-white">
              {weather ? `${weather.temperature}°C / ${weather.humidity}%` : '...'}
            </p>
            <span className="text-[10px] text-slate-500">Atmospheric Profile</span>
          </div>
        </div>

        {/* Disaster Risk Score & XGBoost Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-400">XGBoost Risk Probability</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-red-950 text-red-300 border border-red-500/30 rounded font-mono font-semibold">
                XGBoost
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {risk ? `${(risk.risk_probability * 100).toFixed(1)}%` : '...'}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({risk ? risk.risk_level : '...'})
              </span>
            </p>
            <span className="text-[10px] text-slate-500">
              {risk?.model_name || 'XGBClassifier Baseline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Map & Shelter Recommendation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base text-white">Geographic Situation & Shelter Map</h3>
              <p className="text-xs text-slate-400">
                Visualizing target epicenter, candidate shelters, and optimal evacuation route
              </p>
            </div>
            <button
              onClick={() => onNavigateToShelters()}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Full GIS View &rarr;
            </button>
          </div>

          <LeafletMap
            center={[latitude, longitude]}
            zoom={12}
            incidentLocation={[latitude, longitude]}
            incidentName={locationName}
            shelters={sheltersList}
            nearestShelterId={shelterResult?.shelter?.id}
            routeCoordinates={shelterResult?.route_coordinates}
            height="380px"
          />
        </div>

        {/* Recommended Shelter Card & Advisory */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Primary Refuge</span>
                <h4 className="font-bold text-sm text-white">
                  {shelterResult ? shelterResult.shelter.name : 'Locating...'}
                </h4>
              </div>
            </div>

            {shelterResult && (
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Region:</span>
                  <span className="text-white font-medium">{shelterResult.shelter.region}</span>
                </div>
                {shelterResult.shelter.address && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Address:</span>
                    <span className="text-slate-200 text-right font-medium text-[11px]">
                      {shelterResult.shelter.address}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance from Hazard:</span>
                  <span className="text-emerald-400 font-bold">{shelterResult.distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Beds:</span>
                  <span className="text-white font-medium">
                    {shelterResult.available_capacity} / {shelterResult.shelter.capacity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Hotline:</span>
                  <span className="text-blue-400 font-medium">
                    {shelterResult.shelter.contact_phone || 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Advisory & Directives */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">XGBoost Risk Assessment</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {risk?.advisory || 'Awaiting meteorological telemetry...'}
            </p>
            {risk?.factors && (
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5 text-[11px] mb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Meteorological Feature Weights</span>
                <div className="flex justify-between text-slate-300">
                  <span>Rainfall Weight:</span>
                  <span className="font-mono text-cyan-400">{risk.factors.rainfall_impact}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Wind Velocity Weight:</span>
                  <span className="font-mono text-cyan-400">{risk.factors.wind_impact}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Humidity Weight:</span>
                  <span className="font-mono text-cyan-400">{risk.factors.humidity_impact}%</span>
                </div>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => onNavigateToReports()}
                className="w-full py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4" />
                Generate Comprehensive SitRep
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assessment Audit Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="font-bold text-base text-white mb-3">Recent Historical Assessments</h3>
        {recentAssessments.length === 0 ? (
          <p className="text-xs text-slate-400">No assessments stored yet. Click "Save Assessment" above to record one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase font-semibold text-slate-400">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Sector</th>
                  <th className="p-2.5">Threat Level</th>
                  <th className="p-2.5">Risk Score</th>
                  <th className="p-2.5">Rain / Wind</th>
                  <th className="p-2.5">Nearest Shelter</th>
                  <th className="p-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-bold text-slate-400">#{a.id}</td>
                    <td className="p-2.5 font-medium text-white">{a.location_name}</td>
                    <td className="p-2.5">
                      <ThreatBadge level={a.risk_level} size="sm" />
                    </td>
                    <td className="p-2.5 font-semibold">{a.risk_score} / 100</td>
                    <td className="p-2.5">
                      {a.weather_rainfall || 0} mm / {a.weather_wind_speed || 0} km/h
                    </td>
                    <td className="p-2.5">{a.shelter_distance_km ? `${a.shelter_distance_km} km` : 'N/A'}</td>
                    <td className="p-2.5 text-slate-400">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
