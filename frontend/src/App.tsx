import { useState, useEffect } from 'react';
import { Activity, Cpu, ShieldCheck, Globe2, Zap, BrainCircuit, ActivityIcon, Play, RefreshCw, Send, X } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface NodeData {
  id: number;
  name: string;
  type: string;
  coordinates: [number, number];
  risk_score: number;
  affected_by: string[];
}

interface EventData {
  name: string;
  type: string;
  lon: number;
  lat: number;
  radius: number;
  severity: number;
}

interface Metrics {
  dataset_size: string;
  pandas_time_sec: number;
  rapids_cudf_time_sec: number;
  acceleration_factor: string;
}

interface LogData {
  id: number;
  time: string;
  message: string;
  level: string;
}

// Simple Typewriter component for the AI insights
const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(intervalId);
    }, 15); // typing speed
    
    return () => clearInterval(intervalId);
  }, [text]);

  const formatInsight = (t: string) => {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n').map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line }} style={{ marginBottom: '8px' }} />);
  };

  return <>{formatInsight(displayedText)}</>;
};

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [trends, setTrends] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(true);
  
  // Node selection state
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const fetchData = async () => {
    try {
      const [nodesRes, metricsRes, insightRes, trendsRes, logsRes, eventsRes] = await Promise.all([
        fetch('/api/nodes').catch(() => null),
        fetch('/api/metrics').catch(() => null),
        fetch('/api/insights').catch(() => null),
        fetch('/api/trends').catch(() => null),
        fetch('/api/logs').catch(() => null),
        fetch('/api/events').catch(() => null),
      ]);

      if (nodesRes) {
        const nodesData = await nodesRes.json();
        setNodes(nodesData.data);
        setHighRiskCount(nodesData.high_risk_nodes);
      }
      if (metricsRes) setMetrics(await metricsRes.json());
      if (insightRes) setInsight((await insightRes.json()).insight);
      if (trendsRes) setTrends((await trendsRes.json()).data);
      if (logsRes) setLogs((await logsRes.json()).logs);
      if (eventsRes) setEvents((await eventsRes.json()).events);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval: any;
    if (simulating) {
      interval = setInterval(fetchData, 10000);
    }
    return () => clearInterval(interval);
  }, [simulating]);

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Activity size={48} />
        </motion.div>
        <span style={{ marginLeft: 16 }}>Initializing ChainGuardian...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container animated-bg">
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <Globe2 size={28} color="#60a5fa" />
          ChainGuardian
        </div>
        
        <div className="header-controls">
           <button onClick={() => setSimulating(!simulating)} className={`control-btn ${simulating ? 'active' : ''}`}>
              {simulating ? <RefreshCw size={16} className="spin" /> : <Play size={16} />} 
              {simulating ? 'Live Sync: ON' : 'Live Sync: PAUSED'}
           </button>
        </div>

        <div className="header-badges">
          <div className="badge nvidia"><Zap size={14} /> NVIDIA RAPIDS Accelerated</div>
          <div className="badge google"><BrainCircuit size={14} /> Gemini AI Powered</div>
        </div>
      </header>

      {/* Sidebar - Insights, Charts & Metrics */}
      <aside className="sidebar" style={{ overflowY: 'auto' }}>
        {/* Gemini AI Insights Panel */}
        <motion.div className="glass-panel glowing-panel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="panel-title gemini"><BrainCircuit size={20} /> AI Risk Intelligence</h2>
          <div className="insight-content" style={{ minHeight: '120px' }}>
            {insight ? <Typewriter text={insight} /> : "Awaiting insights..."}
          </div>
          <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
            <button className="action-btn primary"><Send size={14} /> Execute Rerouting Plan</button>
            <button className="action-btn secondary">Notify Suppliers</button>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div className="glass-panel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="panel-title" style={{ color: '#60a5fa' }}><ActivityIcon size={20} /> Global Risk Trend</h2>
          <div style={{ height: 200, width: '100%', marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="high_risk_nodes" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Acceleration Metrics */}
        <motion.div className="glass-panel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="panel-title rapids"><Cpu size={20} /> RAPIDS Performance</h2>
          {metrics ? (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Dataset Size</div>
                <div className="metric-value" style={{ fontSize: '1rem' }}>{metrics.dataset_size}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Speedup Factor</div>
                <div className="metric-value highlight" style={{ textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>{metrics.acceleration_factor}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Standard Pandas</div>
                <div className="metric-value" style={{ color: '#ef4444' }}>{metrics.pandas_time_sec}s</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">cuDF (GPU)</div>
                <div className="metric-value" style={{ color: '#10b981' }}>{metrics.rapids_cudf_time_sec}s</div>
              </div>
            </div>
          ) : (<div>Loading metrics...</div>)}
        </motion.div>
      </aside>

      {/* Main Content - Map & Logs */}
      <main className="main-content">
        <div className="status-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             {highRiskCount > 0 ? (
               <><span className="pulse-dot"></span> <span style={{ color: '#ef4444', fontWeight: 600 }}>Active Disruption Detected ({highRiskCount} Nodes)</span></>
             ) : (
               <><ShieldCheck size={16} color="#10b981" /> <span style={{ color: '#10b981', fontWeight: 600 }}>Network Stable</span></>
             )}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live tracking via BigQuery & cuDF</div>
        </div>

        <div className="map-container" style={{ height: '70%', position: 'relative' }}>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 130 }} width={800} height={400} style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={8} translateExtent={[[0, 0], [800, 400]]}>
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#0f172a"
                      stroke="#1e293b"
                      strokeWidth={1}
                      style={{ default: { outline: "none" }, hover: { fill: "#1e293b", outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>

              {/* Render Weather Events as massive translucent circles */}
              {events.map((event, idx) => (
                 <Marker key={`event-${idx}`} coordinates={[event.lon, event.lat]}>
                   <motion.circle
                     r={event.radius * 2} // visually scale radius
                     fill="rgba(239, 68, 68, 0.15)"
                     stroke="rgba(239, 68, 68, 0.4)"
                     strokeWidth={1}
                     initial={{ scale: 0.8, opacity: 0.5 }}
                     animate={{ scale: 1.2, opacity: 0.8 }}
                     transition={{ repeat: Infinity, duration: 4, repeatType: 'reverse' }}
                   />
                   {/* Outer Impact Zone */}
                   <motion.circle
                     r={event.radius * 3.5}
                     fill="transparent"
                     stroke="rgba(245, 158, 11, 0.3)"
                     strokeWidth={0.5}
                     strokeDasharray="4 4"
                   />
                   <title>{event.name} (Impact Radius: ~{event.radius*111}km)</title>
                 </Marker>
              ))}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isHighRisk = node.risk_score > 0.7;
                return (
                  <Marker key={node.id} coordinates={node.coordinates} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                    <motion.circle 
                      r={isHighRisk ? 5 : 3} 
                      fill={isHighRisk ? "#ef4444" : "#10b981"} 
                      whileHover={{ scale: 2 }}
                    />
                    {isHighRisk && (
                      <motion.circle r={12} fill="transparent" stroke="#ef4444" strokeWidth={1.5}
                        initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
          
          {/* Map Legend */}
          <div style={{ position: 'absolute', bottom: 15, left: 15, background: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div> Safe Port (Normal Ops)</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Critical Risk Port</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.6)' }}></div> GDACS Live Disaster Zone</div>
          </div>
        </div>

        {/* Node Detail Slide-out Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              className="node-detail-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <button className="close-btn" onClick={() => setSelectedNode(null)}><X size={20} /></button>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 5 }}>{selectedNode.name}</h3>
              <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: 20 }}>{selectedNode.type}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Risk Score</div>
                   <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: selectedNode.risk_score > 0.7 ? '#ef4444' : '#10b981' }}>
                     {(selectedNode.risk_score * 100).toFixed(1)}%
                   </div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Coordinates</div>
                   <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                     {selectedNode.coordinates[1].toFixed(2)}, {selectedNode.coordinates[0].toFixed(2)}
                   </div>
                 </div>
              </div>

              {selectedNode.affected_by.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 5 }}>Affected By</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedNode.affected_by.map((event, idx) => (
                      <span key={idx} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Logs Bottom Panel */}
        <div className="logs-panel">
          <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Live Event Stream</h3>
          <div className="logs-list scrollbar-custom">
             {logs.map(log => (
               <div key={log.id} className={`log-item ${log.level}`}>
                 <span className="log-time">{log.time}</span>
                 <span className="log-msg">{log.message}</span>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
