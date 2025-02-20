import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import logo from "../assets/Ala-too_International_University_Seal.png";
import profileIcon from "../assets/free-icon-student-4211262.png";
import logoutIcon from "../assets/exit.png";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportQuality, setExportQuality] = useState('high');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  
    const fetchSubjects = async () => {
      try {
        const response = await fetch("http://localhost:7070/api/subjects", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            setSubjects(data);
          } else {
            throw new Error("Invalid data format received");
          }
        } catch (e) {
          console.error('Raw response:', text);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
        setError(error.message || "Failed to load subjects");
      }
    };
  
    fetchSubjects();
  }, [navigate]);

  const handleSubjectSelect = (index, subjectName) => {
    const newSelection = [...selectedSubjects];
    newSelection[index] = subjectName;
    setSelectedSubjects(newSelection);
  };

  const handleScoreChange = (subjectName, value) => {
    setScores((prev) => ({
      ...prev,
      [subjectName]: Math.min(100, Math.max(0, Number(value) || 0)),
    }));
  };

  const handleVisualize = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (selectedSubjects.length !== 3 || selectedSubjects.some(subject => !scores[subject])) {
      setError("Please select three courses and enter their grades.");
      return;
    }

    const email = localStorage.getItem("email"); // Retrieve stored email
    const payload = selectedSubjects.map(subjectName => ({
      subjectName,
      score: scores[subjectName] || 0  // Ensure correct property name
    }));

    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:7070/api/visualize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`  // Include the token
        },
        body: JSON.stringify(payload), // Send as array, no email field
      });

      if (response.status === 401) {
        console.warn("Unauthorized! Redirecting to login.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setVisualizationData(data);
    } catch (err) {
      console.error("Visualization error:", err);
      setError(err.message || "Failed to visualize data");
    } finally {
      setLoading(false);
    }
};


  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        format: 'png',
        quality: exportQuality === 'high' ? 1.0 : exportQuality === 'medium' ? 0.7 : 0.5,
        width: exportQuality === 'high' ? 1200 : exportQuality === 'medium' ? 900 : 600
      });

      const response = await fetch(`/api/diagram/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate diagram");
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Empty image file');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `competency-diagram-${new Date().toISOString()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.message || "Failed to download diagram");
    }
  };

  const chartData = visualizationData && {
    labels: [
      ...Object.keys(visualizationData.commonSkills),
      ...Object.keys(visualizationData.singleSkills),
    ],
    datasets: [
      {
        label: "Competency Scores",
        data: [
          ...Object.values(visualizationData.commonSkills),
          ...Object.values(visualizationData.singleSkills),
        ],
        backgroundColor: [
          ...Object.keys(visualizationData.commonSkills).map(() => "#003087"),
          ...Object.keys(visualizationData.singleSkills).map(
            (_, i) => `hsl(${(i * 360) / 5}, 70%, 50%)`
          ),
        ],
        borderColor: "#002266",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="home-container">
      <header className="header">
        <img
          src={logo}
          alt="Ala-Too University Logo"
          className="university-logo" 
          
        />
        <div className="header-icons">
          <img
            src={profileIcon}
            alt="Profile"
            className="icon"
            onClick={() => navigate("/profile")}
          />
          <img
            src={logoutIcon}
            alt="Logout"
            className="icon"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          />
        </div>
      </header>

      <div className="course-selection">
        <h2 className="section-title">Select 3 Courses and Their Grades</h2>
        <div className="course-grid">
          {[0, 1, 2].map((index) => (
            <div key={index} className="course-box">
              <select
                className="course-select"
                value={selectedSubjects[index] || ""}
                onChange={(e) => handleSubjectSelect(index, e.target.value)}
              >
                <option value="">Select a course</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="score-input"
                placeholder="Grade (0-100)"
                min="0"
                max="100"
                value={scores[selectedSubjects[index]] || ""}
                onChange={(e) =>
                  handleScoreChange(selectedSubjects[index], e.target.value)
                }
                disabled={!selectedSubjects[index]}
              />
            </div>
          ))}
        </div>

        <button
          className="visualize-button"
          onClick={handleVisualize}
          disabled={loading || selectedSubjects.filter(Boolean).length !== 3}
        >
          {loading ? "Processing..." : "Visualize"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {visualizationData && (
        <div className="chart-container">
          <h2 className="chart-title">Competency Analysis</h2>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Competency Score (%)'
                  }
                },
                x: {
                  ticks: { autoSkip: false },
                  title: {
                    display: true,
                    text: 'Skills'
                  }
                },
              },
            }}
          />
          
          <div className="export-controls">
            <select 
              value={exportQuality} 
              onChange={(e) => setExportQuality(e.target.value)}
              className="quality-select"
            >
              <option value="high">High Quality</option>
              <option value="medium">Medium </option>
              <option value="low">Low </option>
            </select>
            <button onClick={handleDownload} className="download-button">
              Download Diagram
            </button>
          </div>

          <div className="legend-container">
            <div className="legend-item">
              <span className="legend-color common"></span>
              Common Skills (Grouped)
            </div>
            <div className="legend-item">
              <span className="legend-color single"></span>
              Single Skills (Individual)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;