import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

// API 기본 URL 설정
const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 우선 사용
  if (process.env.REACT_APP_API_URL) {
    console.log("환경 변수에서 API URL 사용:", process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  const hostname = window.location.hostname;
  console.log("현재 호스트명:", hostname);

  // 프로덕션 환경에서는 NGROK URL 사용
  if (hostname === "eieconcierge.com" || hostname === "www.eieconcierge.com") {
    const ngrokUrl = "https://be8b2c8c5bb3.ngrok-free.app";
    console.log("프로덕션 환경에서 NGROK URL 사용:", ngrokUrl);
    return ngrokUrl;
  }

  const localUrl = `http://${hostname}:3001`;
  console.log("로컬 환경에서 URL 사용:", localUrl);
  return localUrl;
};

const API_BASE_URL = getApiBaseUrl();

// 초기 상태
const initialState = {
  timerLogs: [],
  blockLogs: [],
  workSessions: [],
  productivityData: {
    daily: {},
    weekly: {},
    monthly: {},
  },
  aiAnalysis: null,
  currentDate: new Date().toISOString().split("T")[0],
  todayStats: {
    workTime: 0,
    completedTasks: 0,
    focusScore: 0,
    productivity: 0,
  },
  isLoading: false,
  error: null,
};

// 액션 타입
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_TIMER_LOGS: "SET_TIMER_LOGS",
  SET_BLOCK_LOGS: "SET_BLOCK_LOGS",
  SET_WORK_SESSIONS: "SET_WORK_SESSIONS",
  SET_PRODUCTIVITY_DATA: "SET_PRODUCTIVITY_DATA",
  SET_AI_ANALYSIS: "SET_AI_ANALYSIS",
  SET_CURRENT_DATE: "SET_CURRENT_DATE",
  SET_TODAY_STATS: "SET_TODAY_STATS",
  ADD_TIMER_LOG: "ADD_TIMER_LOG",
  ADD_BLOCK_LOG: "ADD_BLOCK_LOG",
  ADD_WORK_SESSION: "ADD_WORK_SESSION",
  UPDATE_WORK_SESSION: "UPDATE_WORK_SESSION",
  DELETE_WORK_SESSION: "DELETE_WORK_SESSION",
  SYNC_LOGS: "SYNC_LOGS",
};

// 리듀서
const productivityReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ACTIONS.SET_TIMER_LOGS:
      return { ...state, timerLogs: action.payload };
    case ACTIONS.SET_BLOCK_LOGS:
      return { ...state, blockLogs: action.payload };
    case ACTIONS.SET_WORK_SESSIONS:
      return { ...state, workSessions: action.payload };
    case ACTIONS.SET_PRODUCTIVITY_DATA:
      return { ...state, productivityData: action.payload };
    case ACTIONS.SET_AI_ANALYSIS:
      return { ...state, aiAnalysis: action.payload };
    case ACTIONS.SET_CURRENT_DATE:
      return { ...state, currentDate: action.payload };
    case ACTIONS.SET_TODAY_STATS:
      return { ...state, todayStats: action.payload };
    case ACTIONS.ADD_TIMER_LOG:
      return {
        ...state,
        timerLogs: [
          ...(Array.isArray(state.timerLogs) ? state.timerLogs : []),
          action.payload,
        ],
      };
    case ACTIONS.ADD_BLOCK_LOG:
      return {
        ...state,
        blockLogs: [
          ...(Array.isArray(state.blockLogs) ? state.blockLogs : []),
          action.payload,
        ],
      };
    case ACTIONS.ADD_WORK_SESSION:
      return {
        ...state,
        workSessions: [
          ...(Array.isArray(state.workSessions) ? state.workSessions : []),
          {
            id: action.payload.id,
            startTime: action.payload.startTime || "",
            endTime: action.payload.endTime || "",
            task: action.payload.task || "",
            completed: action.payload.completed || false,
            date: action.payload.date,
            timestamp: action.payload.timestamp,
          },
        ],
      };
    case ACTIONS.UPDATE_WORK_SESSION:
      return {
        ...state,
        workSessions: (Array.isArray(state.workSessions)
          ? state.workSessions
          : []
        ).map((session) =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };
    case ACTIONS.DELETE_WORK_SESSION:
      return {
        ...state,
        workSessions: (Array.isArray(state.workSessions)
          ? state.workSessions
          : []
        ).filter((session) => session.id !== action.payload),
      };
    case ACTIONS.SYNC_LOGS:
      return {
        ...state,
        timerLogs: action.payload.timerLogs || state.timerLogs,
        blockLogs: action.payload.blockLogs || state.blockLogs,
      };
    default:
      return state;
  }
};

// Context 생성
const ProductivityContext = createContext();

// Provider 컴포넌트
export const ProductivityProvider = ({ children }) => {
  // 초기 상태를 안전하게 설정
  const getInitialState = () => {
    const savedCurrentDate = localStorage.getItem("productivity_current_date");

    // 로컬 스토리지에서 안전하게 로드하는 헬퍼 함수
    const safeLoadFromStorage = (key, defaultValue = []) => {
      try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;

        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch (error) {
        console.error(`${key} 로드 실패:`, error);
        return defaultValue;
      }
    };

    return {
      ...initialState,
      // 강제로 배열로 설정하고 로컬 스토리지에서 안전하게 로드
      timerLogs: safeLoadFromStorage("productivity_timer_logs", []),
      blockLogs: safeLoadFromStorage("productivity_block_logs", []),
      workSessions: safeLoadFromStorage("productivity_work_sessions", []),
      currentDate: savedCurrentDate || initialState.currentDate,
    };
  };

  const [state, dispatch] = useReducer(productivityReducer, getInitialState());

  // 안전한 데이터 정리 함수 (순환 참조 방지)
  const sanitizeData = useCallback((data, seen = new WeakSet()) => {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    // 순환 참조 방지
    if (seen.has(data)) {
      return "[Circular Reference]";
    }
    seen.add(data);

    // DOM 요소나 React 컴포넌트 완전 제외
    if (
      data instanceof Element ||
      data instanceof HTMLElement ||
      data instanceof HTMLButtonElement
    ) {
      return "[DOM Element]";
    }

    // React Fiber 노드 제외
    if (data.constructor && data.constructor.name === "FiberNode") {
      return "[React Fiber]";
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => sanitizeData(item, seen))
        .filter(
          (item) =>
            item !== undefined &&
            item !== "[DOM Element]" &&
            item !== "[React Fiber]"
        );
    }

    const cleanData = {};
    for (const [key, value] of Object.entries(data)) {
      // React 관련 속성 완전 제외
      if (
        key.startsWith("__react") ||
        key.startsWith("_react") ||
        key.includes("react")
      ) {
        continue;
      }

      // DOM 요소나 이벤트 객체 완전 제외
      if (value && typeof value === "object") {
        if (
          value.nodeType ||
          value.tagName ||
          value.target ||
          value.currentTarget ||
          value.nativeEvent ||
          value.__reactFiber$ ||
          value.__reactInternalInstance$ ||
          value.constructor?.name === "FiberNode" ||
          value instanceof Element ||
          value instanceof HTMLElement
        ) {
          continue;
        }
      }

      cleanData[key] = sanitizeData(value, seen);
    }

    return cleanData;
  }, []);

  // 로컬 스토리지 저장 함수 (안전한 JSON 변환)
  const saveToLocalStorage = useCallback(
    (key, data) => {
      try {
        // 데이터 정리 - 강제 적용
        const cleanData = sanitizeData(data);

        // 추가 안전 검사
        if (cleanData === null || cleanData === undefined) {
          console.warn("정리된 데이터가 null/undefined입니다:", key);
          localStorage.setItem(key, JSON.stringify([]));
          return;
        }

        // JSON 변환 시도
        const jsonString = JSON.stringify(cleanData);
        localStorage.setItem(key, jsonString);
      } catch (error) {
        console.error("데이터 저장 실패:", error);
        console.error("문제가 된 데이터:", data);

        // 실패 시 기본값 저장
        try {
          localStorage.setItem(key, JSON.stringify([]));
        } catch (fallbackError) {
          console.error("기본값 저장도 실패:", fallbackError);
        }
      }
    },
    [sanitizeData]
  );

  // 로컬 스토리지에서 불러오기
  const loadFromLocalStorage = useCallback((key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        return defaultValue;
      }

      const parsed = JSON.parse(data);

      // 배열이 아닌 경우 기본값 반환
      if (!Array.isArray(parsed)) {
        console.warn(`${key}가 배열이 아닙니다:`, parsed);
        return defaultValue;
      }

      return parsed;
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
      return defaultValue;
    }
  }, []);

  // 차단 시간 계산
  const calculateBlockTime = useCallback(() => {
    const todayBlockLogs = (
      Array.isArray(state.blockLogs) ? state.blockLogs : []
    ).filter((log) => log.date === state.currentDate);
    return todayBlockLogs.reduce((total, log) => {
      if (log.duration) {
        return total + log.duration;
      }
      return total;
    }, 0);
  }, [state.blockLogs, state.currentDate]);

  // 오늘 통계 계산
  const calculateTodayStats = useCallback(() => {
    const todaySessions = (
      Array.isArray(state.workSessions) ? state.workSessions : []
    ).filter((session) => {
      const sessionDate = session.date || state.currentDate;
      return sessionDate === state.currentDate;
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

    dispatch({ type: ACTIONS.SET_TODAY_STATS, payload: newStats });

    // 생산성 데이터 업데이트
    const updatedProductivityData = {
      ...state.productivityData,
      daily: {
        ...(state.productivityData?.daily || {}),
        [state.currentDate]: {
          workTime: newStats.workTime,
          breakTime: Math.max(0, 8 - newStats.workTime),
          completedTasks: newStats.completedTasks,
          focusScore: newStats.focusScore,
          // calculateBlockTime을 인라인으로 계산하여 의존성 문제 해결
          blockTime: (Array.isArray(state.blockLogs) ? state.blockLogs : [])
            .filter((log) => log.date === state.currentDate)
            .reduce((total, log) => total + (log.duration || 0), 0),
          productivity: newStats.productivity,
        },
      },
    };

    dispatch({
      type: ACTIONS.SET_PRODUCTIVITY_DATA,
      payload: updatedProductivityData,
    });
    saveToLocalStorage("productivity_data", updatedProductivityData);
  }, [
    state.workSessions,
    state.currentDate,
    state.blockLogs,
    saveToLocalStorage,
    // state.productivityData를 의존성에서 제거하여 무한 루프 방지
    // calculateBlockTime을 의존성에서 제거하여 무한 루프 방지
  ]);

  // 타이머 로그 추가
  const addTimerLog = useCallback(
    async (duration, type) => {
      const newLog = {
        id: Date.now(),
        date: state.currentDate,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        duration,
        type,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/timer-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration, type }),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
          console.log("타이머 로그가 서버에 저장되었습니다.");
        } else {
          dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
          saveToLocalStorage("productivity_timer_logs", [
            ...state.timerLogs,
            newLog,
          ]);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
        saveToLocalStorage("productivity_timer_logs", [
          ...state.timerLogs,
          newLog,
        ]);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, state.timerLogs, saveToLocalStorage]
  );

  // 차단 로그 추가
  const addBlockLog = useCallback(
    async (duration, reason) => {
      const newLog = {
        id: Date.now(),
        date: state.currentDate,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        duration,
        reason,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/block-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration, reason }),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
          console.log("차단 로그가 서버에 저장되었습니다.");
        } else {
          dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
          saveToLocalStorage("productivity_block_logs", [
            ...state.blockLogs,
            newLog,
          ]);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
        saveToLocalStorage("productivity_block_logs", [
          ...state.blockLogs,
          newLog,
        ]);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, state.blockLogs, saveToLocalStorage]
  );

  // 작업 세션 추가
  const addWorkSession = useCallback(
    async (session) => {
      // 순수한 데이터 객체만 생성 (유효한 기본값 사용)
      const newSession = {
        id: Date.now(),
        startTime: session.startTime || "00:00",
        endTime: session.endTime || "00:00",
        task: session.task || "작업을 입력해주세요",
        completed: !!session.completed,
        date: state.currentDate,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/work-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSession),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
          // 서버 저장 성공 시 즉시 localStorage 업데이트
          const currentSessions = loadFromLocalStorage(
            "productivity_work_sessions",
            []
          );
          const updatedSessions = [...currentSessions, newSession];
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
          console.log("작업 세션이 서버에 저장되었습니다.");
        } else if (response.status === 400) {
          // 서버에 세션 등록 실패 - 로컬에서만 저장하고 경고
          console.warn(
            "서버에 세션 등록 실패 (400), 로컬에서만 저장:",
            newSession
          );
          dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
          const currentSessions = loadFromLocalStorage(
            "productivity_work_sessions",
            []
          );
          const updatedSessions = [...currentSessions, newSession];
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
        } else {
          // 기타 서버 오류
          dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
          const currentSessions = loadFromLocalStorage(
            "productivity_work_sessions",
            []
          );
          const updatedSessions = [...currentSessions, newSession];
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        // 네트워크 오류 - 로컬에서만 저장
        dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
        const currentSessions = loadFromLocalStorage(
          "productivity_work_sessions",
          []
        );
        const updatedSessions = [...currentSessions, newSession];
        saveToLocalStorage("productivity_work_sessions", updatedSessions);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, saveToLocalStorage, loadFromLocalStorage]
  );

  // 작업 세션 업데이트
  const updateWorkSession = useCallback(
    async (id, field, value) => {
      // 로컬 스토리지에서 현재 세션 데이터 가져오기
      const currentSessions = loadFromLocalStorage(
        "productivity_work_sessions",
        []
      );

      // React 상태에서도 세션 확인
      const stateSessions = Array.isArray(state.workSessions)
        ? state.workSessions
        : [];

      // 해당 세션이 로컬 스토리지나 React 상태에 존재하는지 확인
      const sessionExistsInStorage = currentSessions.some(
        (session) => session.id === id
      );
      const sessionExistsInState = stateSessions.some(
        (session) => session.id === id
      );

      if (!sessionExistsInStorage && !sessionExistsInState) {
        console.warn(
          "로컬 스토리지와 상태에 모두 존재하지 않는 세션 업데이트 시도:",
          id
        );
        return;
      }

      // React 상태와 localStorage를 통합하여 최신 데이터 사용
      const allSessions = [...currentSessions];

      // React 상태에 있는 세션이 localStorage에 없으면 추가
      stateSessions.forEach((stateSession) => {
        if (!allSessions.some((s) => s.id === stateSession.id)) {
          allSessions.push(stateSession);
        }
      });

      // 순수한 업데이트 데이터만 생성
      const updatedSessions = allSessions.map((session) =>
        session.id === id
          ? {
              ...session,
              [field]: value,
              lastUpdated: new Date().toISOString(),
            }
          : session
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/work-sessions/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          }
        );

        if (response.ok) {
          dispatch({
            type: ACTIONS.UPDATE_WORK_SESSION,
            payload: { id, updates: { [field]: value } },
          });
          console.log("작업 세션이 서버에서 업데이트되었습니다.");
        } else if (response.status === 404) {
          // 서버에 존재하지 않는 세션 - 로컬에서만 업데이트
          console.warn("서버에 존재하지 않는 세션:", id);
          dispatch({
            type: ACTIONS.UPDATE_WORK_SESSION,
            payload: { id, updates: { [field]: value } },
          });
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
        } else {
          // 기타 서버 오류
          dispatch({
            type: ACTIONS.UPDATE_WORK_SESSION,
            payload: { id, updates: { [field]: value } },
          });
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
          console.error("서버 업데이트 실패, localStorage에 저장");
        }
      } catch (error) {
        // 네트워크 오류 - 로컬에서만 업데이트
        dispatch({
          type: ACTIONS.UPDATE_WORK_SESSION,
          payload: { id, updates: { [field]: value } },
        });
        saveToLocalStorage("productivity_work_sessions", updatedSessions);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [saveToLocalStorage, loadFromLocalStorage, state.workSessions]
  );

  // 작업 세션 삭제
  const deleteWorkSession = useCallback(
    async (id) => {
      // 로컬 스토리지에서 현재 세션 데이터 가져오기
      const currentSessions = loadFromLocalStorage(
        "productivity_work_sessions",
        []
      );
      const filteredSessions = currentSessions.filter(
        (session) => session.id !== id
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/work-sessions/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
          console.log("작업 세션이 서버에서 삭제되었습니다.");
        } else if (response.status === 404) {
          // 서버에 존재하지 않는 세션 - 로컬에서만 삭제
          console.warn("서버에 존재하지 않는 세션 삭제:", id);
          dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
          saveToLocalStorage("productivity_work_sessions", filteredSessions);
        } else {
          // 기타 서버 오류
          dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
          saveToLocalStorage("productivity_work_sessions", filteredSessions);
          console.error("서버 삭제 실패, localStorage에 저장");
        }
      } catch (error) {
        // 네트워크 오류 - 로컬에서만 삭제
        dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
        saveToLocalStorage("productivity_work_sessions", filteredSessions);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [saveToLocalStorage, loadFromLocalStorage]
  );

  // 서버 데이터 동기화 확인
  const syncWithServer = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/work-sessions`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessions) {
          // 서버 데이터로 로컬 상태 업데이트
          dispatch({ type: ACTIONS.SET_WORK_SESSIONS, payload: data.sessions });
          saveToLocalStorage("productivity_work_sessions", data.sessions);
          console.log("서버 데이터와 동기화 완료");
        }
      } else {
        console.warn("서버 동기화 실패:", response.status);
      }
    } catch (error) {
      console.error("서버 동기화 실패:", error);
    }
  }, [saveToLocalStorage]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // API_BASE_URL이 비어있으면 오프라인 모드
      if (!API_BASE_URL) {
        console.log("오프라인 모드로 실행 중");
        const savedTimerLogs = loadFromLocalStorage("productivity_timer_logs");
        const savedBlockLogs = loadFromLocalStorage("productivity_block_logs");
        const savedWorkSessions = loadFromLocalStorage(
          "productivity_work_sessions"
        );
        const savedProductivityData = loadFromLocalStorage(
          "productivity_data",
          {
            daily: {},
            weekly: {},
            monthly: {},
          }
        );
        const savedAiAnalysis = loadFromLocalStorage(
          "productivity_ai_analysis"
        );

        dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: savedTimerLogs });
        dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: savedBlockLogs });
        dispatch({
          type: ACTIONS.SET_WORK_SESSIONS,
          payload: savedWorkSessions,
        });
        dispatch({
          type: ACTIONS.SET_PRODUCTIVITY_DATA,
          payload: savedProductivityData,
        });
        if (savedAiAnalysis && typeof savedAiAnalysis === "object") {
          dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: savedAiAnalysis });
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/timer-logs`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: data.timerLogs });
        dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: data.blockLogs });
        dispatch({
          type: ACTIONS.SET_WORK_SESSIONS,
          payload: data.workSessions,
        });
        dispatch({
          type: ACTIONS.SET_PRODUCTIVITY_DATA,
          payload: data.productivityData,
        });
        if (data.aiAnalysis && typeof data.aiAnalysis === "object") {
          dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: data.aiAnalysis });
        }
        console.log("데이터 로드 완료");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      console.log("오프라인 모드로 전환");

      // 오프라인 모드로 전환
      const savedTimerLogs = loadFromLocalStorage("productivity_timer_logs");
      const savedBlockLogs = loadFromLocalStorage("productivity_block_logs");
      const savedWorkSessions = loadFromLocalStorage(
        "productivity_work_sessions"
      );
      const savedProductivityData = loadFromLocalStorage("productivity_data", {
        daily: {},
        weekly: {},
        monthly: {},
      });
      const savedAiAnalysis = loadFromLocalStorage("productivity_ai_analysis");
      dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: savedTimerLogs });
      dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: savedBlockLogs });
      dispatch({
        type: ACTIONS.SET_WORK_SESSIONS,
        payload: savedWorkSessions,
      });
      dispatch({
        type: ACTIONS.SET_PRODUCTIVITY_DATA,
        payload: savedProductivityData,
      });
      if (savedAiAnalysis && typeof savedAiAnalysis === "object") {
        dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: savedAiAnalysis });
      }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [loadFromLocalStorage]);

  // 로그 동기화
  const syncLogs = useCallback(async () => {
    const localTimerLogs = loadFromLocalStorage("productivity_timer_logs");
    const localBlockLogs = loadFromLocalStorage("productivity_block_logs");

    if (localTimerLogs.length > 0 || localBlockLogs.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sync-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timerLogs: localTimerLogs,
            blockLogs: localBlockLogs,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.SYNC_LOGS, payload: data });
          localStorage.removeItem("productivity_timer_logs");
          localStorage.removeItem("productivity_block_logs");
          console.log("로그 동기화 완료");
        }
      } catch (error) {
        console.error("로그 동기화 실패:", error);
      }
    }
  }, [loadFromLocalStorage]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 통계 계산
  useEffect(() => {
    calculateTodayStats();
  }, [calculateTodayStats]); // calculateTodayStats 의존성 추가

  const value = {
    ...state,
    addTimerLog,
    addBlockLog,
    addWorkSession,
    updateWorkSession,
    deleteWorkSession,
    loadData,
    syncLogs,
    syncWithServer,
    calculateTodayStats,
    calculateBlockTime,
    setCurrentDate: (date) => {
      dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: date });
      localStorage.setItem("productivity_current_date", date);
    },
    setAiAnalysis: (analysis) => {
      dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: analysis });
      saveToLocalStorage("productivity_ai_analysis", analysis);
    },
  };

  return (
    <ProductivityContext.Provider value={value}>
      {children}
    </ProductivityContext.Provider>
  );
};

// Hook
export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error(
      "useProductivity must be used within a ProductivityProvider"
    );
  }
  return context;
};
