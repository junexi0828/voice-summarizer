import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  BarChart3,
  Target,
  TrendingUp,
  Brain,
  Settings,
  X,
  Plus,
  Edit,
  Trash,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Activity,
  Zap,
  Save,
  Shield,
} from "lucide-react";

// API 기본 URL 설정 - 동적 IP 감지
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();

const ProductivityManager = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timerLogs, setTimerLogs] = useState([]);
  const [blockLogs, setBlockLogs] = useState([]);
  const [workSessions, setWorkSessions] = useState([]);
  const [productivityData, setProductivityData] = useState({
    daily: {},
    weekly: {},
    monthly: {},
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [todayStats, setTodayStats] = useState({
    workTime: 0,
    completedTasks: 0,
    focusScore: 0,
    productivity: 0,
  });

  // 컴포넌트 마운트 시 저장된 데이터 불러오기
  useEffect(() => {
    loadSavedData();
    // 컴포넌트 마운트 시 로그 동기화
    syncLogsWithServer();
  }, []);

  const syncLogsWithServer = async () => {
    try {
      // localStorage의 로그들을 서버와 동기화
      const localTimerLogs = JSON.parse(
        localStorage.getItem("productivity_timer_logs") || "[]"
      );
      const localBlockLogs = JSON.parse(
        localStorage.getItem("productivity_block_logs") || "[]"
      );

      if (localTimerLogs.length > 0 || localBlockLogs.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/sync-logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timerLogs: localTimerLogs,
            blockLogs: localBlockLogs,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTimerLogs(data.timerLogs || []);
          setBlockLogs(data.blockLogs || []);

          // 동기화 후 localStorage 정리
          localStorage.removeItem("productivity_timer_logs");
          localStorage.removeItem("productivity_block_logs");

          console.log("로그 동기화 완료");
        }
      }
    } catch (error) {
      console.error("로그 동기화 실패:", error);
    }
  };

  // 오늘 통계 계산
  useEffect(() => {
    calculateTodayStats();
  }, [workSessions, currentDate]);

  const loadSavedData = async () => {
    try {
      // 백엔드 서버에서 로그 불러오기
      try {
        const [timerResponse, blockResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/timer-logs`),
          fetch(`${API_BASE_URL}/api/block-logs`),
        ]);

        if (timerResponse.ok) {
          const timerData = await timerResponse.json();
          setTimerLogs(timerData.logs || []);
        } else {
          // 서버 실패 시 localStorage에서 불러오기
          const savedTimerLogs = localStorage.getItem(
            "productivity_timer_logs"
          );
          if (savedTimerLogs) {
            setTimerLogs(JSON.parse(savedTimerLogs));
          }
        }

        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          setBlockLogs(blockData.logs || []);
        } else {
          // 서버 실패 시 localStorage에서 불러오기
          const savedBlockLogs = localStorage.getItem(
            "productivity_block_logs"
          );
          if (savedBlockLogs) {
            setBlockLogs(JSON.parse(savedBlockLogs));
          }
        }
      } catch (error) {
        console.error("서버 연결 실패, localStorage에서 불러오기:", error);
        // 서버 연결 실패 시 localStorage에서 불러오기
        const savedTimerLogs = localStorage.getItem("productivity_timer_logs");
        if (savedTimerLogs) {
          setTimerLogs(JSON.parse(savedTimerLogs));
        }

        const savedBlockLogs = localStorage.getItem("productivity_block_logs");
        if (savedBlockLogs) {
          setBlockLogs(JSON.parse(savedBlockLogs));
        }
      }

      // 작업 세션 불러오기
      const savedWorkSessions = localStorage.getItem(
        "productivity_work_sessions"
      );
      if (savedWorkSessions) {
        setWorkSessions(JSON.parse(savedWorkSessions));
      }

      // 생산성 데이터 불러오기
      const savedProductivityData = localStorage.getItem("productivity_data");
      if (savedProductivityData) {
        setProductivityData(JSON.parse(savedProductivityData));
      }

      // AI 분석 결과 불러오기
      const savedAiAnalysis = localStorage.getItem("productivity_ai_analysis");
      if (savedAiAnalysis) {
        setAiAnalysis(JSON.parse(savedAiAnalysis));
      }
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    }
  };

  const saveData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("데이터 저장 실패:", error);
    }
  };

  const calculateTodayStats = () => {
    const todaySessions = workSessions.filter((session) => {
      const sessionDate = session.date || currentDate;
      return sessionDate === currentDate;
    });

    const totalWorkTime = todaySessions.reduce((total, session) => {
      if (session.startTime && session.endTime) {
        const start = new Date(`2000-01-01T${session.startTime}`);
        const end = new Date(`2000-01-01T${session.endTime}`);
        const diffHours = (end - start) / (1000 * 60 * 60);
        return total + Math.max(0, diffHours);
      }
      return total;
    }, 0);

    const completedTasks = todaySessions.filter(
      (session) => session.completed
    ).length;
    const totalTasks = todaySessions.length;
    const focusScore =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 생산성 점수 계산 (작업 시간 + 완료율 + 집중도)
    const productivity = Math.round(
      Math.min(
        100,
        (totalWorkTime / 8) * 40 + (completedTasks / 10) * 30 + focusScore * 0.3
      )
    );

    const newStats = {
      workTime: Math.round(totalWorkTime * 10) / 10,
      completedTasks,
      focusScore,
      productivity,
    };

    setTodayStats(newStats);

    // 오늘 데이터를 생산성 데이터에 저장
    const updatedProductivityData = {
      ...productivityData,
      daily: {
        ...productivityData.daily,
        [currentDate]: {
          workTime: newStats.workTime,
          breakTime: Math.max(0, 8 - newStats.workTime),
          completedTasks: newStats.completedTasks,
          focusScore: newStats.focusScore,
          blockTime: calculateBlockTime(),
          productivity: newStats.productivity,
        },
      },
    };

    setProductivityData(updatedProductivityData);
    saveData("productivity_data", updatedProductivityData);
  };

  const calculateBlockTime = () => {
    // 오늘 차단 로그에서 차단 시간 계산
    const todayBlockLogs = blockLogs.filter((log) => log.date === currentDate);
    return todayBlockLogs.reduce((total, log) => {
      if (log.duration) {
        return total + log.duration;
      }
      return total;
    }, 0);
  };

  const addTimerLog = async (duration, type) => {
    const newLog = {
      id: Date.now(),
      date: currentDate,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      duration: duration,
      type: type, // 'focus' 또는 'break'
    };

    try {
      // 백엔드 서버에 저장
      const response = await fetch(`${API_BASE_URL}/api/timer-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration, type }),
      });

      if (response.ok) {
        const updatedLogs = [...timerLogs, newLog];
        setTimerLogs(updatedLogs);
        console.log("타이머 로그가 서버에 저장되었습니다.");
      } else {
        // 서버 저장 실패 시 localStorage에 저장
        const updatedLogs = [...timerLogs, newLog];
        setTimerLogs(updatedLogs);
        saveData("productivity_timer_logs", updatedLogs);
        console.error("서버 저장 실패, localStorage에 저장");
      }
    } catch (error) {
      // 서버 연결 실패 시 localStorage에 저장
      const updatedLogs = [...timerLogs, newLog];
      setTimerLogs(updatedLogs);
      saveData("productivity_timer_logs", updatedLogs);
      console.error("서버 연결 실패, localStorage에 저장:", error);
    }
  };

  const addBlockLog = async (duration, reason) => {
    const newLog = {
      id: Date.now(),
      date: currentDate,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      duration: duration,
      reason: reason,
    };

    try {
      // 백엔드 서버에 저장
      const response = await fetch(`${API_BASE_URL}/api/block-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration, reason }),
      });

      if (response.ok) {
        const updatedLogs = [...blockLogs, newLog];
        setBlockLogs(updatedLogs);
        console.log("차단 로그가 서버에 저장되었습니다.");
      } else {
        // 서버 저장 실패 시 localStorage에 저장
        const updatedLogs = [...blockLogs, newLog];
        setBlockLogs(updatedLogs);
        saveData("productivity_block_logs", updatedLogs);
        console.error("서버 저장 실패, localStorage에 저장");
      }
    } catch (error) {
      // 서버 연결 실패 시 localStorage에 저장
      const updatedLogs = [...blockLogs, newLog];
      setBlockLogs(updatedLogs);
      saveData("productivity_block_logs", updatedLogs);
      console.error("서버 연결 실패, localStorage에 저장:", error);
    }
  };

  const addWorkSession = () => {
    const newSession = {
      id: Date.now(),
      date: currentDate,
      startTime: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: "",
      task: "",
      completed: false,
    };
    const updatedSessions = [...workSessions, newSession];
    setWorkSessions(updatedSessions);
    saveData("productivity_work_sessions", updatedSessions);
  };

  const updateWorkSession = (id, field, value) => {
    const updatedSessions = workSessions.map((session) =>
      session.id === id ? { ...session, [field]: value } : session
    );
    setWorkSessions(updatedSessions);
    saveData("productivity_work_sessions", updatedSessions);
  };

  const deleteWorkSession = (id) => {
    const updatedSessions = workSessions.filter((session) => session.id !== id);
    setWorkSessions(updatedSessions);
    saveData("productivity_work_sessions", updatedSessions);
  };

  const getWeeklyData = () => {
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = productivityData.daily[dateStr];

      if (dayData && dayData.productivity > 0) {
        weekData.push(dayData.productivity);
      } else {
        // 실제 데이터가 없는 경우 0으로 표시
        weekData.push(0);
      }
    }

    return weekData;
  };

  const getTimeDistribution = () => {
    const todayData = productivityData.daily[currentDate] || {
      workTime: 0,
      breakTime: 0,
      blockTime: 0,
    };

    const totalTime =
      todayData.workTime + todayData.breakTime + todayData.blockTime;
    if (totalTime === 0) return { work: 0, break: 0, block: 0 };

    return {
      work: Math.round((todayData.workTime / totalTime) * 100),
      break: Math.round((todayData.breakTime / totalTime) * 100),
      block: Math.round((todayData.blockTime / totalTime) * 100),
    };
  };

  const analyzeProductivity = async () => {
    setShowAnalysisModal(true);

    // 실제 데이터 기반 AI 분석
    const analysisData = {
      workSessions: workSessions.filter((s) => s.date === currentDate),
      productivityData: productivityData.daily,
      timerLogs: timerLogs.filter((log) => log.date === currentDate),
      blockLogs: blockLogs.filter((log) => log.date === currentDate),
      todayStats,
    };

    // AI 분석 로직 (실제로는 AI API 호출)
    setTimeout(() => {
      const analysis = generateAIAnalysis(analysisData);
      setAiAnalysis(analysis);
      saveData("productivity_ai_analysis", analysis);
      setShowAnalysisModal(false);
    }, 2000);
  };

  const generateAIAnalysis = (data) => {
    const { workSessions, productivityData, timerLogs, blockLogs, todayStats } =
      data;

    // 평균 생산성 계산 (실제 데이터만 사용)
    const productivityValues = Object.values(productivityData)
      .filter((d) => d.productivity > 0) // 실제 데이터만 필터링
      .map((d) => d.productivity);
    const avgProductivity =
      productivityValues.length > 0
        ? productivityValues.reduce((a, b) => a + b, 0) /
          productivityValues.length
        : 0;

    // 트렌드 분석
    const trends = [];

    // 실제 데이터가 있는 경우에만 분석
    if (todayStats.workTime > 0) {
      if (todayStats.workTime < 6) {
        trends.push("작업 시간이 권장 시간(6-8시간)보다 적습니다");
      }
      if (todayStats.focusScore < 70) {
        trends.push("작업 완료율이 낮아 집중도 개선이 필요합니다");
      }
      if (avgProductivity > 0 && todayStats.productivity < avgProductivity) {
        trends.push("오늘 생산성이 평균보다 낮습니다");
      }
    } else {
      trends.push("아직 충분한 데이터가 없습니다. 작업 세션을 추가해보세요!");
    }

    // 개선 제안
    const recommendations = [];

    // 실제 데이터가 있는 경우에만 제안
    if (todayStats.workTime > 0) {
      if (todayStats.workTime < 6) {
        recommendations.push("작업 시간을 2시간 더 늘려보세요");
      }
      if (todayStats.focusScore < 70) {
        recommendations.push("작업을 작은 단위로 나누어 완료율을 높이세요");
      }
    }

    // 일반적인 제안
    if (workSessions.length < 5) {
      recommendations.push("하루에 최소 5개의 작업 세션을 만들어보세요");
    }
    if (timerLogs.length === 0) {
      recommendations.push("포모도로 타이머를 활용하여 집중력을 향상시키세요");
    }
    if (blockLogs.length === 0) {
      recommendations.push("차단 기능을 사용하여 방해 요소를 제거하세요");
    }

    // 데이터가 없는 경우 기본 제안
    if (recommendations.length === 0) {
      recommendations.push("첫 번째 작업 세션을 추가해보세요!");
    }

    // 예상 개선 효과
    const improvements = [];
    if (todayStats.workTime < 6) {
      improvements.push("작업 시간 2시간 증가");
    }
    if (todayStats.focusScore < 70) {
      improvements.push("집중도 20% 향상");
    }
    improvements.push("전체 생산성 15% 향상");

    return {
      overallScore: todayStats.productivity,
      trends: trends.length > 0 ? trends : ["현재 생산성이 양호합니다"],
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ["현재 패턴을 유지하세요"],
      improvements: improvements,
      analysisDate: currentDate,
    };
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">오늘 작업 시간</p>
              <p className="text-2xl font-bold text-blue-800">
                {todayStats.workTime}시간
              </p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">완료된 작업</p>
              <p className="text-2xl font-bold text-green-800">
                {todayStats.completedTasks}개
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">집중도</p>
              <p className="text-2xl font-bold text-purple-800">
                {todayStats.focusScore}%
              </p>
            </div>
            <Target className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">생산성 점수</p>
              <p className="text-2xl font-bold text-orange-800">
                {todayStats.productivity}점
              </p>
            </div>
            <TrendingUp className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* 타이머 & 차단 로그 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 타이머 로그 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              타이머 실행 로그
            </h3>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {timerLogs.filter((log) => log.date === currentDate).length ===
            0 ? (
              <div className="text-center py-4 text-gray-500">
                <Clock className="mx-auto mb-2" size={24} />
                <p className="text-sm">오늘 타이머 실행 기록이 없습니다</p>
              </div>
            ) : (
              timerLogs
                .filter((log) => log.date === currentDate)
                .slice(-5)
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          log.type === "focus" ? "bg-blue-500" : "bg-green-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {log.type === "focus" ? "집중 시간" : "휴식 시간"}
                        </p>
                        <p className="text-xs text-gray-600">{log.time}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {log.duration}분
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* 차단 로그 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              차단 실행 로그
            </h3>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {blockLogs.filter((log) => log.date === currentDate).length ===
            0 ? (
              <div className="text-center py-4 text-gray-500">
                <Shield className="mx-auto mb-2" size={24} />
                <p className="text-sm">오늘 차단 실행 기록이 없습니다</p>
              </div>
            ) : (
              blockLogs
                .filter((log) => log.date === currentDate)
                .slice(-5)
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {log.reason || "사이트 차단"}
                        </p>
                        <p className="text-xs text-gray-600">{log.time}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {log.duration}분
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* AI 분석 버튼 */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">AI 생산성 분석</h3>
            <p className="text-purple-100">
              AI가 당신의 작업 패턴을 분석하고 개선 방향을 제시합니다
            </p>
          </div>
          <button
            onClick={analyzeProductivity}
            className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            <Brain size={20} />
            분석 시작
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const weeklyData = getWeeklyData();
    const timeDistribution = getTimeDistribution();

    return (
      <div className="space-y-6">
        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              주간 생산성 트렌드
            </h3>
            <div className="h-64 bg-gray-50 rounded flex items-end justify-center gap-2 p-4">
              {weeklyData.map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-8 transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${value * 2}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">
                    {["월", "화", "수", "목", "금", "토", "일"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              작업 시간 분포
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">집중 작업</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${timeDistribution.work}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {timeDistribution.work}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">휴식 시간</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${timeDistribution.break}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {timeDistribution.break}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">차단 시간</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${timeDistribution.block}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {timeDistribution.block}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 달력 뷰 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            생산성 달력
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 4; // 1일부터 시작
              const date = new Date();
              date.setDate(date.getDate() - (29 - day));
              const dateStr = date.toISOString().split("T")[0];
              const dayData = productivityData.daily[dateStr];
              const productivity = dayData ? dayData.productivity : 0;

              // 실제 데이터가 있는 경우에만 색상 표시
              const colorClass =
                productivity > 0
                  ? productivity > 80
                    ? "bg-green-500"
                    : productivity > 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                  : "bg-gray-100";

              return (
                <div key={i} className="p-2 text-center">
                  {day > 0 && day <= 30 && (
                    <div
                      className={`w-8 h-8 rounded mx-auto flex items-center justify-center text-white text-xs font-medium ${colorClass}`}
                    >
                      {day}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkSessions = () => {
    const todaySessions = workSessions.filter(
      (session) => session.date === currentDate
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            작업 세션 관리
          </h3>
          <button
            onClick={addWorkSession}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            세션 추가
          </button>
        </div>

        <div className="space-y-4">
          {todaySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto mb-2" size={32} />
              <p>오늘 등록된 작업 세션이 없습니다.</p>
              <p className="text-sm">새로운 작업 세션을 추가해보세요!</p>
            </div>
          ) : (
            todaySessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(e) =>
                        updateWorkSession(
                          session.id,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="p-2 border border-gray-300 rounded"
                    />
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(e) =>
                        updateWorkSession(session.id, "endTime", e.target.value)
                      }
                      className="p-2 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={session.task}
                      onChange={(e) =>
                        updateWorkSession(session.id, "task", e.target.value)
                      }
                      placeholder="작업 내용"
                      className="p-2 border border-gray-300 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateWorkSession(
                            session.id,
                            "completed",
                            !session.completed
                          )
                        }
                        className={`p-2 rounded ${
                          session.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => deleteWorkSession(session.id)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAIRecommendations = () => (
    <div className="space-y-6">
      {aiAnalysis ? (
        <>
          {/* 전체 점수 */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg text-white text-center">
            <h3 className="text-lg font-semibold mb-2">AI 생산성 분석 결과</h3>
            <div className="text-4xl font-bold mb-2">
              {aiAnalysis.overallScore}점
            </div>
            <p className="text-purple-100">전체 생산성 점수</p>
            <p className="text-xs text-purple-200 mt-2">
              분석일: {aiAnalysis.analysisDate}
            </p>
          </div>

          {/* 트렌드 분석 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              트렌드 분석
            </h3>
            <div className="space-y-3">
              {aiAnalysis.trends.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded"
                >
                  <AlertCircle className="text-blue-600 mt-1" size={16} />
                  <p className="text-sm text-gray-700">{trend}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 개선 제안 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="text-yellow-600" size={20} />
              AI 개선 제안
            </h3>
            <div className="space-y-3">
              {aiAnalysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded"
                >
                  <Zap className="text-yellow-600 mt-1" size={16} />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 예상 개선 효과 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="text-green-600" size={20} />
              예상 개선 효과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiAnalysis.improvements.map((improvement, index) => (
                <div
                  key={index}
                  className="p-4 bg-green-50 rounded text-center"
                >
                  <p className="text-sm text-green-600 font-medium">
                    {improvement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Brain className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            AI 분석이 필요합니다
          </h3>
          <p className="text-gray-500 mb-4">
            AI가 당신의 작업 패턴을 분석하고 개선 방향을 제시합니다
          </p>
          <button
            onClick={analyzeProductivity}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            분석 시작하기
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">생산성 관리</h1>
        <p className="text-gray-600">
          작업 패턴을 분석하고 AI의 도움으로 생산성을 향상시켜보세요
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          개요
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 font-medium ${
            activeTab === "analytics"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          분석
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 font-medium ${
            activeTab === "sessions"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          작업 세션
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 font-medium ${
            activeTab === "ai"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          AI 제안
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "analytics" && renderAnalytics()}
      {activeTab === "sessions" && renderWorkSessions()}
      {activeTab === "ai" && renderAIRecommendations()}

      {/* AI 분석 모달 */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AI 분석 중...
              </h3>
              <p className="text-gray-600">
                작업 패턴을 분석하고 개선 방향을 찾고 있습니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductivityManager;
