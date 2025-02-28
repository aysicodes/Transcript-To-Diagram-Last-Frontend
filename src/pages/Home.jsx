import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import "chart.js/auto";
import logo from "../assets/Ala-too_International_University_Seal.png";
import profileIcon from "../assets/free-icon-student-4211262.png";
import logoutIcon from "../assets/exit.png";
import "./Home.css";

Chart.register(...registerables, annotationPlugin);

const Home = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([""]);
  const [scores, setScores] = useState({});
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportQuality, setExportQuality] = useState("high");
  const [newSubjectName, setNewSubjectName] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await fetch("/api/subjects", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading subjects:", error);
        setError(error.message || "Failed to load subjects");
      }
    };

    fetchSubjects();
  }, [navigate, token]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return alert("Please enter a subject name.");

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubjectName }),
      });

      if (!response.ok) throw new Error("Failed to add subject");
      
      const newSubject = await response.json();
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
    } catch (error) {
      console.error("Error adding subject:", error);
      setError(error.message || "Failed to add subject");
    }
  };

  const handleSubjectSelect = (index, subjectName) => {
    const newSelection = [...selectedSubjects];
    newSelection[index] = subjectName;
    setSelectedSubjects(newSelection);
  };

  const handleScoreChange = (subjectName, value) => {
    setScores(prev => ({
      ...prev,
      [subjectName]: Math.min(100, Math.max(0, Number(value) || 0)),
    }));
  };

  const handleAddCourse = () => {
    setSelectedSubjects([...selectedSubjects, ""]);
  };

  const handleRemoveCourse = (index) => {
    const newSubjects = [...selectedSubjects];
    newSubjects.splice(index, 1);
    setSelectedSubjects(newSubjects);
  };

  const handleVisualize = async () => {
    if (!token) return navigate("/login");
    
    if (selectedSubjects.some(subject => !subject || !scores[subject])) {
      return setError("Please select courses and enter their grades.");
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedSubjects.map(subjectName => ({
          subjectName,
          score: scores[subjectName] || 0,
        }))),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return navigate("/login");
      }

      if (!response.ok) throw new Error(await response.text());
      
      setVisualizationData(await response.json());
    } catch (err) {
      console.error("Visualization error:", err);
      setError(err.message || "Failed to visualize data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams({
        format: "png",
        quality: exportQuality === "high" ? 1.0 : exportQuality === "medium" ? 0.7 : 0.5,
        width: exportQuality === "high" ? 2400 : exportQuality === "medium" ? 1800 : 1200,
        height: 1200,
        devicePixelRatio: exportQuality === "high" ? 2.0 : 1.5,
      });

      const response = await fetch(`/api/diagram/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Empty image file");

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `competency-diagram-${new Date().toISOString()}.png`;
      
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < 100) throw new Error("Invalid image generated");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      };
      img.src = url;
      
    } catch (err) {
      console.error("Download failed:", err);
      setError(err.message || "Failed to download diagram");
    }
  };

  const chartData = visualizationData && {
    labels: [
      ...Object.keys(visualizationData.commonSkills),
      ...Object.keys(visualizationData.singleSkills),
    ],
    datasets: [{
      label: "Competency Scores",
      data: [
        ...Object.values(visualizationData.commonSkills),
        ...Object.values(visualizationData.singleSkills),
      ],
      backgroundColor: [
        ...Object.keys(visualizationData.commonSkills).map(() => "#003087"),
        ...Object.keys(visualizationData.singleSkills).map((_, i) => 
          `hsl(${(i * 360) / 5}, 70%, 50%)`
        ),
      ],
      borderColor: "#002266",
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      annotation: {
        annotations: {
          medianLine: {
            type: "line",
            yMin: 50,
            yMax: 50,
            borderColor: "#FF5733",
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: "Median 50",
              enabled: true,
              position: "end",
              font: { size: 14 },
            },
          },
          highLevelLine: {
            type: "line",
            yMin: 80,
            yMax: 80,
            borderColor: "#2ECC71",
            borderWidth: 2,
            label: {
              content: "High Level 80",
              enabled: true,
              position: "end",
              font: { size: 14 },
            },
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Competency Score (%)", font: { size: 16 } },
        ticks: { font: { size: 14 } },
      },
      x: {
        ticks: {
          font: { size: 12 },
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          padding: 20,
        },
        title: { display: true, text: "Skills", font: { size: 16 } },
      },
    },
  };

  return (
    <div className="home-container">
      <header className="header">
        <img src={logo} alt="University Logo" className="university-logo" />
        <div className="header-icons">
          <img src={profileIcon} alt="Profile" className="icon" onClick={() => navigate("/profile")} />
          <img src={logoutIcon} alt="Logout" className="icon" onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }} />
        </div>
      </header>

      <div className="course-selection">
        <h2 className="section-title">Select Courses and Their Grades</h2>
        <div className="course-grid">
          {selectedSubjects.map((subject, index) => (
            <div key={index} className="course-box">
              <select
                value={subject || ""}
                onChange={(e) => handleSubjectSelect(index, e.target.value)}
                className="course-select"
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
                value={scores[subject] || ""}
                onChange={(e) => handleScoreChange(subject, e.target.value)}
                disabled={!subject}
              />
              {index > 0 && (
                <button 
                  className="remove-course-button"
                  onClick={() => handleRemoveCourse(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="course-controls">
          <button
            className="add-course-button"
            onClick={handleAddCourse}
            disabled={selectedSubjects.length >= 5}
          >
            Add Course
          </button>

          <button
            className="visualize-button"
            onClick={handleVisualize}
            disabled={loading || selectedSubjects.some(s => !s || !scores[s])}
          >
            {loading ? "Processing..." : "Visualize"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="add-subject">
        <input
          type="text"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="New subject name"
          className="subject-input"
        />
        <button onClick={handleAddSubject} className="add-subject-button">
          Add Subject
        </button>
      </div>

      {visualizationData && (
        <div className="chart-container">
          <h2 className="chart-title">Competency Analysis</h2>
          <div style={{ position: "relative", height: "60vh", width: "80vw" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="export-controls">
            <select
              value={exportQuality}
              onChange={(e) => setExportQuality(e.target.value)}
              className="quality-select"
            >
              <option value="high">High Quality</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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