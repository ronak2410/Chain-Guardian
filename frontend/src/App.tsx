import { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, ShieldCheck, Globe2, Zap, BrainCircuit, ActivityIcon, Play, RefreshCw, Send, X, AlertTriangle, MessageSquare, Bot } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Line as MapLine } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface NodeData {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
  risk_score: number;
  affected_by: string[];
  region?: string;
  status?: string;
  cargo_value?: string;
  disruption_time?: string;
  ai_routing?: string;
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

  const [selectedRegion, setSelectedRegion] = useState('All');
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  
  // Chat Copilot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your ChainGuardian Gemini Assistant. I am monitoring 10 global hubs against active GDACS threats. How can I optimize your supply chain today?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiTyping(true);

    // Simulate Gemini API Call
    setTimeout(() => {
      setIsAiTyping(false);
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `Analysis complete. Based on the latest GDACS feeds, there is an elevated risk cluster near your primary routes. I strongly recommend executing the "Alpha Fallback" reroute via the Panama Canal, which will mitigate 94% of the financial risk (${(Math.random() * 5 + 2).toFixed(1)}M USD) with only a 48-hour delivery delay. Should I execute this reroute across the network?` 
      }]);
    }, 1800);
  };

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
      
      if (eventsRes) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
        const alerts = (eventsData.events || []).map((e: any) => `⚠️ ${e.type} ALERT: ${e.name} detected at lat ${e.lat.toFixed(2)}, lon ${e.lon.toFixed(2)}.`);
        setActiveAlerts(alerts);
      }
    } catch (e) {
      console.error(e);
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
           <select 
             value={selectedRegion} 
             onChange={(e) => setSelectedRegion(e.target.value)}
             className="control-btn" 
             style={{ 
               backgroundColor: '#1e293b', 
               color: '#e2e8f0', 
               border: '1px solid #334155',
               borderRadius: '6px',
               padding: '8px 12px',
               cursor: 'pointer',
               outline: 'none'
             }}
           >
             <option value="All" style={{ background: '#1e293b' }}>🌍 Global Overview</option>
             <option value="Asia Pacific" style={{ background: '#1e293b' }}>🌏 Asia (CN, JP, KR, SG)</option>
             <option value="Europe" style={{ background: '#1e293b' }}>🌍 Europe (UK, DE, NL)</option>
             <option value="North America" style={{ background: '#1e293b' }}>🌎 North America (USA)</option>
           </select>
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
          <div className="alert-ticker">
            {/* @ts-ignore */}
            <marquee scrollamount="4">
              {activeAlerts.length > 0 ? activeAlerts.join('   |   ') : "No active alerts in monitored regions."}
            {/* @ts-ignore */}
            </marquee>
          </div>
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

              {/* Render Supply Routes */}
              <MapLine
                from={[121.4737, 31.2304]} // Shanghai
                to={[-118.2437, 34.0522]} // LA
                stroke="#60a5fa"
                strokeWidth={1}
                strokeLinecap="round"
                style={{ strokeDasharray: "4 4", opacity: 0.5 }}
              />
              <MapLine
                from={[4.4791, 51.9244]} // Rotterdam
                to={[-74.0060, 40.7128]} // NYC
                stroke="#60a5fa"
                strokeWidth={1}
                strokeLinecap="round"
                style={{ strokeDasharray: "4 4", opacity: 0.5 }}
              />
              <MapLine
                from={[55.2708, 25.2048]} // Dubai
                to={[103.8198, 1.3521]} // Singapore
                stroke="#60a5fa"
                strokeWidth={1}
                strokeLinecap="round"
                style={{ strokeDasharray: "4 4", opacity: 0.5 }}
              />

              {/* Render Nodes */}
              {nodes.filter((node) => selectedRegion === 'All' || node.region === selectedRegion).map((node) => {
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {selectedNode.name}
                </h2>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <div style={{ marginBottom: 20, padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 5 }}>Risk Status</div>
                <div style={{ color: selectedNode.risk_score > 0.7 ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedNode.risk_score > 0.7 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                  {selectedNode.status || (selectedNode.risk_score > 0.7 ? 'Critical Impact' : 'Normal Operations')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cargo at Risk</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 5 }}>{selectedNode.cargo_value || "$0.0M"}</div>
                </div>
                <div style={{ flex: 1, padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Est. Disruption</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 5, color: selectedNode.risk_score > 0.7 ? '#f59e0b' : 'white' }}>{selectedNode.disruption_time || "None"}</div>
                </div>
              </div>

              {selectedNode.affected_by && selectedNode.affected_by.length > 0 && (
                <div style={{ padding: 15, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> Active Threats
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#fecaca', fontSize: '0.9rem' }}>
                    {selectedNode.affected_by.map((event, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{event}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNode.risk_score > 0.7 && (
                <div className="glowing-panel pulse-glow" style={{ padding: 15, background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BrainCircuit size={16} /> AI Routing Recommendation
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.4' }}>
                    {selectedNode.ai_routing || "Hold at anchor (48hrs)"}
                  </div>
                  <button className="control-btn" style={{ marginTop: 15, width: '100%', justifyContent: 'center', background: '#0ea5e9', color: 'white' }}>
                    Execute Reroute
                  </button>
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

      {/* Gemini AI Copilot Floating UI */}
      <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              style={{
                width: 350,
                height: 450,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: 16,
                border: '1px solid rgba(139, 92, 246, 0.4)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Chat Header */}
              <div style={{ padding: '15px 20px', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold' }}>
                  <Bot size={20} color="#a855f7" /> Gemini Copilot
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ 
                      background: msg.sender === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)', 
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      padding: '10px 15px', 
                      borderRadius: 12,
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: 12, fontSize: '0.9rem', color: '#a855f7' }}>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      Analyzing network data...
                    </motion.div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ padding: 15, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Gemini to analyze routes..." 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: 8, color: 'white', outline: 'none' }}
                />
                <button onClick={handleSendMessage} style={{ background: '#8b5cf6', border: 'none', borderRadius: 8, width: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer' }}>
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{ 
            width: 60, height: 60, borderRadius: 30, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
            border: 'none', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)', cursor: 'pointer', outline: 'none'
          }}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </div>
  );
}

export default App;
