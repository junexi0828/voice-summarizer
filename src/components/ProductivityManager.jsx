import React, { useState } from "react";
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
import { useProductivity } from "../contexts/ProductivityContext";

const ProductivityManager = () => {
  const {
    timerLogs,
    blockLogs,
    workSessions,
    productivityData,
    aiAnalysis,
    currentDate,
    todayStats,
    isLoading,
    error,
    addTimerLog,
    addBlockLog,
    addWorkSession,
    updateWorkSession,
    deleteWorkSession,
    syncLogs,
    setCurrentDate,
    setAiAnalysis,
  } = useProductivity();

  const [activeTab, setActiveTab] = useState("overview");
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

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
      // Context를 통해 AI 분석 결과 저장
      setAiAnalysis(analysis);
      setShowAnalysisModal(false);
    }, 2000);
  };

  const generateAIAnalysis = (data) => {
    const { workSessions, productivityData, timerLogs, blockLogs, todayStats } =
      data;

    // 평균 생산성 계산 (실제 데이터만 사용)
    const productivityValues = Object.values(productivityData)
      .filter((d) => d.productivity > 0)
      .map((d) => d.productivity);
    const avgProductivity =
      productivityValues.length > 0
        ? productivityValues.reduce((a, b) => a + b, 0) /
          productivityValues.length
        : 0;

    // 트렌드 분석
    const trends = [];

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

    if (todayStats.workTime > 0) {
      if (todayStats.workTime < 6) {
        recommendations.push("작업 시간을 2시간 더 늘려보세요");
      }
      if (todayStats.focusScore < 70) {
        recommendations.push("작업을 작은 단위로 나누어 완료율을 높이세요");
      }
    }

    if (workSessions.length < 5) {
      recommendations.push("하루에 최소 5개의 작업 세션을 만들어보세요");
    }
    if (timerLogs.length === 0) {
      recommendations.push("포모도로 타이머를 활용하여 집중력을 향상시키세요");
    }
    if (blockLogs.length === 0) {
      recommendations.push("차단 기능을 사용하여 방해 요소를 제거하세요");
    }

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
      {/* 날짜 선택기 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">날짜 선택</h3>
          </div>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => {
              // Context를 통해 날짜 변경
              setCurrentDate(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">
                타이머 실행 로그
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addTimerLog(25, "focus")}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                <Clock size={14} />
                집중 25분
              </button>
              <button
                onClick={() => addTimerLog(5, "break")}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                <Clock size={14} />
                휴식 5분
              </button>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="text-red-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">
                차단 실행 로그
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addBlockLog(30, "소셜미디어")}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                <Shield size={14} />
                차단 30분
              </button>
            </div>
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
              const day = i - 4;
              const date = new Date();
              date.setDate(date.getDate() - (29 - day));
              const dateStr = date.toISOString().split("T")[0];
              const dayData = productivityData.daily[dateStr];
              const productivity = dayData ? dayData.productivity : 0;

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

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">일반 설정</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">자동 저장</span>
            <button className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-600 rounded text-sm">
              <CheckCircle size={14} />
              활성화됨
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">데이터 동기화</span>
            <button
              onClick={syncLogs}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm"
            >
              <Save size={14} />
              동기화
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">분석 설정</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AI 분석 주기</span>
            <select className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>매일</option>
              <option>주 3회</option>
              <option>주 1회</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">알림 설정</span>
            <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
              <Edit size={14} />
              편집
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <X className="text-red-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">데이터 관리</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">모든 데이터 삭제</span>
            <button className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200">
              <Trash size={14} />
              삭제
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">데이터 내보내기</span>
            <button className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm">
              <Save size={14} />
              내보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
              {(aiAnalysis.trends || []).map((trend, index) => (
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
              {(aiAnalysis.recommendations || []).map((rec, index) => (
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
              {(aiAnalysis.improvements || []).map((improvement, index) => (
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            오류가 발생했습니다
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

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
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 font-medium ${
            activeTab === "settings"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "analytics" && renderAnalytics()}
      {activeTab === "sessions" && renderWorkSessions()}
      {activeTab === "ai" && renderAIRecommendations()}
      {activeTab === "settings" && renderSettings()}

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
