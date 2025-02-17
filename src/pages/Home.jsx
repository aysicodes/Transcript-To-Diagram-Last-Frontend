import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import logo from "../assets/Ala-too_International_University_Seal.png";
import profileIcon from "../assets/free-icon-student-4211262.png";
import logoutIcon from "../assets/exit.png";
import "./Home.css";

const API_URL = "http://localhost:8089";

const Home = () => {
  const navigate = useNavigate();
  const [selectedCourses, setSelectedCourses] = useState({});
  const [courseScores, setCourseScores] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [courseBoxes, setCourseBoxes] = useState([1, 2, 3]);

  const token = localStorage.getItem("token");

  // Загрузка предметов
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${API_URL}/subjects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [token]);

  // Сохранение данных на сервер
  const saveData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/save-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedCourses: Object.fromEntries(
            Object.entries(selectedCourses).map(([key, value]) => [key, value.id])
          ),
          courseScores,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      const result = await response.json();
      console.log("Data saved successfully:", result);
    } catch (error) {
      console.error("Error saving data:", error);
      setError(error);
    }
  };

  // Обработчик выбора курса
  const handleCourseSelect = (boxIndex, subjectId) => {
    const selectedSubject = subjects.find((subject) => subject.id === parseInt(subjectId));
    setSelectedCourses({ ...selectedCourses, [boxIndex]: selectedSubject });
  };

  // Обработчик изменения баллов
  const handleScoreChange = (boxIndex, value) => {
    if (value >= 0 && value <= 100) {
      setCourseScores({ ...courseScores, [boxIndex]: value });
    }
  };

  // Обработчик визуализации
  const handleVisualize = () => {
    if (Object.keys(selectedCourses).length === courseBoxes.length && Object.keys(courseScores).length === courseBoxes.length) {
      const isValid = Object.values(selectedCourses).every((course) => course && course.id);
      if (!isValid) {
        alert("Please select valid courses.");
        return;
      }

      setShowChart(true);
      saveData();
    } else {
      alert(`Please select exactly ${courseBoxes.length} courses and enter their grades.`);
    }
  };

  // Обработчик добавления нового предмета
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      alert("Please enter a subject name.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubjectName }),
      });

      if (!response.ok) {
        throw new Error("Failed to add subject");
      }

      const newSubject = await response.json();
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
    } catch (error) {
      setError(error);
    }
  };

  // Обработчик добавления нового окна для курса
  const handleAddCourseBox = () => {
    const newBoxIndex = courseBoxes.length + 1;
    setCourseBoxes([...courseBoxes, newBoxIndex]);
    setSelectedCourses({ ...selectedCourses, [newBoxIndex]: null });
    setCourseScores({ ...courseScores, [newBoxIndex]: "" });
  };

  // Расчет данных для графика
  const calculateCompetencyScores = () => {
    if (Object.keys(selectedCourses).length === 0) return { labels: [], datasets: [] };

    const sharedScore =
      Object.values(courseScores).length > 0
        ? Object.values(courseScores).reduce((sum, score) => sum + Number(score), 0) /
          Object.values(courseScores).length
        : 0;

    const uniqueCompetencyScores = Object.entries(selectedCourses).flatMap(([boxIndex, course]) => {
      const score = courseScores[boxIndex] || 0;
      if (!course.uniqueCompetences || course.uniqueCompetences.length === 0) {
        return [];
      }
      return course.uniqueCompetences.map((comp) => ({
        competency: comp,
        score: Number(score) || 0,
      }));
    });

    const chartData = {
      labels: ["Shared Competency", ...uniqueCompetencyScores.map((comp) => comp.competency)],
      datasets: [
        {
          label: "Competency Scores",
          data: [sharedScore, ...uniqueCompetencyScores.map((comp) => comp.score)],
          backgroundColor: [
            "#003087",
            ...uniqueCompetencyScores.map(() => `rgba(0, 48, 135, ${Math.random() * 0.7 + 0.3})`),
          ],
          borderColor: ["#002266", ...uniqueCompetencyScores.map(() => "#002266")],
          borderWidth: 1,
        },
      ],
    };

    return chartData;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="home-container">
      <header className="header">
        <img
          src={logo}
          alt="Ala-Too University Logo"
          className="university-logo"
          onClick={() => navigate("/")}
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
        <h2 className="section-title">Select Courses and Their Grades</h2>
        <div className="add-subject">
          <input
            type="text"
            placeholder="Enter new subject name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button onClick={handleAddSubject}>+ Add Subject</button>
        </div>
        <div className="course-grid">
          {courseBoxes.map((boxIndex) => (
            <div key={boxIndex} className="course-box">
              <select
                className="course-select"
                value={selectedCourses[boxIndex]?.id || ""}
                onChange={(e) => handleCourseSelect(boxIndex, e.target.value)}
              >
                <option value="">Select a course</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="score-input"
                placeholder="Enter grade (0-100)"
                min="0"
                max="100"
                value={courseScores[boxIndex] || ""}
                onChange={(e) => handleScoreChange(boxIndex, e.target.value)}
              />
            </div>
          ))}
          <button className="add-course-box" onClick={handleAddCourseBox}>
            + Add Course
          </button>
        </div>
        <button
          className="visualize-button"
          onClick={handleVisualize}
          disabled={Object.keys(selectedCourses).length !== courseBoxes.length || Object.keys(courseScores).length !== courseBoxes.length}
        >
          Visualize Competencies
        </button>
      </div>

      {showChart && (
        <div className="chart-container">
          <h2 className="chart-title">Competency Scores</h2>
          <Bar
            data={calculateCompetencyScores()}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Home;