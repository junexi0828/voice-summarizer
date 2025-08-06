const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// ----- 설정 관리 -----
const CONFIG = {
  system_paths: {
    hosts_file: "/etc/hosts",
    redirect_ip: "127.0.0.1",
    backup_path: "/Library/Application Support/FocusTimer/hosts_backup",
  },
  blocked_websites: {
    youtube: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
      "youtube.googleapis.com",
      "www.youtube.googleapis.com",
      "youtubei.googleapis.com",
      "www.youtubei.googleapis.com",
      "yt3.ggpht.com",
      "i.ytimg.com",
      "ytimg.com",
      "www.ytimg.com",
      "googlevideo.com",
      "www.googlevideo.com",
      "shorts.youtube.com",
      "www.shorts.youtube.com",
    ],
    social_media: [
      "facebook.com",
      "www.facebook.com",
      "instagram.com",
      "www.instagram.com",
      "twitter.com",
      "www.twitter.com",
      "x.com",
      "www.x.com",
      "tiktok.com",
      "www.tiktok.com",
      "reddit.com",
      "www.reddit.com",
    ],
    gaming: [
      "twitch.tv",
      "www.twitch.tv",
      "discord.com",
      "www.discord.com",
      "steamcommunity.com",
      "www.steamcommunity.com",
    ],
    entertainment: [
      "netflix.com",
      "www.netflix.com",
      "disneyplus.com",
      "www.disneyplus.com",
      "spotify.com",
      "www.spotify.com",
    ],
  },
  browsers: {
    supported: [
      "Google Chrome",
      "Safari",
      "Firefox",
      "Whale",
      "Microsoft Edge",
    ],
  },
};

// 상태 관리
let isBlockingEnabled = false;
let blockStats = {
  totalBlocks: 0,
  todayBlocks: 0,
  weeklyBlocks: 0,
  monthlyBlocks: 0,
};

// 사용자 설정 저장소
let userSettings = {
  blockedSites: [],
  blockSchedule: {
    startTime: "09:00",
    endTime: "18:00",
    days: ["월", "화", "수", "목", "금"],
  },
  pomodoroSettings: {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  },
  blockHistory: [],
};

// ----- 유틸리티 함수들 -----
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`명령어 실행 오류: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function log(level, message) {
  const timestamp = new Date().toISOString().replace("T", " ").substr(0, 19);
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry);
}

// 설정 파일 관리
const SETTINGS_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  "focus_timer_settings.json"
);

function saveUserSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(userSettings, null, 2));
    log("INFO", "사용자 설정 저장 완료");
  } catch (error) {
    log("ERROR", `사용자 설정 저장 실패: ${error.message}`);
  }
}

function loadUserSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      userSettings = { ...userSettings, ...JSON.parse(data) };
      log("INFO", "사용자 설정 로드 완료");
    }
  } catch (error) {
    log("ERROR", `사용자 설정 로드 실패: ${error.message}`);
  }
}

// 서버 시작 시 설정 로드
loadUserSettings();

// ----- 브라우저 관리 시스템 -----
class BrowserManager {
  constructor() {
    this.supportedBrowsers = CONFIG.browsers.supported;
  }

  async getRunningBrowsers() {
    const runningBrowsers = [];
    const browserConfigs = [
      {
        name: "Google Chrome",
        process: "Google Chrome",
        appName: "Google Chrome",
      },
      {
        name: "Safari",
        process: "Safari.app/Contents/MacOS/Safari",
        appName: "Safari",
      },
      { name: "Firefox", process: "firefox", appName: "Firefox" },
      { name: "Whale", process: "Whale", appName: "Whale" },
      {
        name: "Microsoft Edge",
        process: "Microsoft Edge",
        appName: "Microsoft Edge",
      },
    ];

    for (const config of browserConfigs) {
      try {
        await executeCommand(`pgrep -f '${config.process}'`);
        runningBrowsers.push(config);
      } catch (error) {
        // 브라우저가 실행 중이지 않음
      }
    }

    return runningBrowsers;
  }

  // 차단 시작 시: 브라우저 닫고 다시 열고 창 복구
  async restartBrowsersForBlocking() {
    try {
      const runningBrowsers = await this.getRunningBrowsers();

      if (runningBrowsers.length === 0) {
        log("INFO", "실행 중인 브라우저가 없습니다.");
        return;
      }

      log(
        "INFO",
        `차단 시작: 브라우저 재시작 중... (${runningBrowsers
          .map((b) => b.name)
          .join(", ")})`
      );

      // 1. 브라우저 세션 저장
      await this.saveBrowserSessions(runningBrowsers);

      // 2. 모든 브라우저 종료
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 종료 중...`);

          // 안전한 종료
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to quit'`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // 강제 종료 (여전히 실행 중인 경우)
          try {
            await executeCommand(`pgrep -f "${browserConfig.process}"`);
            await executeCommand(`pkill -f "${browserConfig.process}"`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            // 이미 종료된 경우 무시
          }

          log("INFO", `${browserConfig.name} 종료 완료`);
        } catch (error) {
          log("ERROR", `${browserConfig.name} 종료 중 오류: ${error.message}`);
        }
      }

      // 3. DNS 캐시 초기화
      await this.flushDNSCache();

      // 4. 브라우저 재시작
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 재시작 중...`);
          await executeCommand(`open -a "${browserConfig.appName}"`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          log("INFO", `${browserConfig.name} 재시작 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 재시작 중 오류: ${error.message}`
          );
        }
      }

      // 5. 브라우저 로딩 대기
      log("INFO", "브라우저 로딩 대기 중...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 6. 창 복구
      await this.restoreBrowserSessions(runningBrowsers);

      log("INFO", "차단 시작: 브라우저 재시작 및 창 복구 완료");
    } catch (error) {
      log("ERROR", `브라우저 재시작 중 오류: ${error.message}`);
    }
  }

  // 차단 해제 시: 브라우저 새로고침만
  async refreshBrowsersForUnblocking() {
    try {
      const runningBrowsers = await this.getRunningBrowsers();

      if (runningBrowsers.length === 0) {
        log("INFO", "실행 중인 브라우저가 없습니다.");
        return;
      }

      log(
        "INFO",
        `차단 해제: 브라우저 새로고침 중... (${runningBrowsers
          .map((b) => b.name)
          .join(", ")})`
      );

      // DNS 캐시 초기화
      await this.flushDNSCache();

      // 각 브라우저 새로고침만
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 새로고침 중...`);

          // 브라우저 활성화
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to activate'`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 새로고침 (Cmd+R)
          await executeCommand(
            "osascript -e 'tell application \"System Events\" to key code 15 using {command down}'"
          );

          log("INFO", `${browserConfig.name} 새로고침 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 새로고침 중 오류: ${error.message}`
          );
        }
      }

      log("INFO", "차단 해제: 브라우저 새로고침 완료");
    } catch (error) {
      log("ERROR", `브라우저 새로고침 중 오류: ${error.message}`);
    }
  }

  async saveBrowserSessions(runningBrowsers) {
    try {
      const sessionInfo = {
        runningBrowsers: runningBrowsers.map((b) => b.name),
        timestamp: new Date().toISOString(),
      };

      const sessionPath = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        "focus_timer_sessions.json"
      );
      fs.writeFileSync(sessionPath, JSON.stringify(sessionInfo, null, 2));

      log(
        "INFO",
        `브라우저 세션 정보 저장 완료 (${runningBrowsers.length}개 브라우저)`
      );
    } catch (error) {
      log("ERROR", `세션 저장 중 오류: ${error.message}`);
    }
  }

  async restoreBrowserSessions(runningBrowsers) {
    try {
      log("INFO", "브라우저 창 복구 중...");

      for (const browserConfig of runningBrowsers) {
        try {
          // 브라우저 활성화
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to activate'`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 새 창 닫기 (Cmd+W) - 3번 반복
          for (let i = 0; i < 3; i++) {
            await executeCommand(
              "osascript -e 'tell application \"System Events\" to key code 13 using {command down}'"
            );
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // 브라우저 활성화 대기
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Cmd+Shift+T로 세션 복구
          await executeCommand(
            "osascript -e 'tell application \"System Events\" to key code 17 using {command down, shift down}'"
          );

          log("INFO", `${browserConfig.name} 창 복구 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 창 복구 중 오류: ${error.message}`
          );
        }
      }

      log("INFO", "브라우저 창 복구 완료");
    } catch (error) {
      log("ERROR", `브라우저 창 복구 중 오류: ${error.message}`);
    }
  }

  async flushDNSCache() {
    try {
      log("INFO", "DNS 캐시 초기화 중...");
      await executeCommand("sudo dscacheutil -flushcache");
      await executeCommand("sudo killall -HUP mDNSResponder");
      log("INFO", "DNS 캐시 초기화 완료");
    } catch (error) {
      log("ERROR", `DNS 캐시 초기화 중 오류: ${error.message}`);
    }
  }
}

// 브라우저 매니저 인스턴스 생성
const browserManager = new BrowserManager();

// ----- hosts 파일 관리 -----
function backupHosts() {
  try {
    const backupPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      "Library/Application Support/FocusTimer/hosts_backup"
    );
    if (!fs.existsSync(backupPath)) {
      // 디렉토리가 없으면 생성
      const dir = path.dirname(backupPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const hostsContent = fs.readFileSync(
        CONFIG.system_paths.hosts_file,
        "utf8"
      );
      fs.writeFileSync(backupPath, hostsContent);
      log("INFO", "hosts 파일 백업 완료");
    }
  } catch (error) {
    log("ERROR", `hosts 파일 백업 실패: ${error.message}`);
  }
}

function blockWebsites() {
  try {
    backupHosts();

    const lines = fs
      .readFileSync(CONFIG.system_paths.hosts_file, "utf8")
      .split("\n");

    // FocusTimer 블록 시작/끝 마커
    const blockStart = "# FocusTimer Block Start";
    const blockEnd = "# FocusTimer Block End";

    // 기존 블록 제거
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(blockStart)) {
        startIdx = i;
      } else if (lines[i].includes(blockEnd)) {
        endIdx = i;
        break;
      }
    }

    if (startIdx !== -1 && endIdx !== -1) {
      lines.splice(startIdx, endIdx - startIdx + 1);
    }

    // 새로운 차단 설정 추가
    lines.push(blockStart);

    // 모든 카테고리의 웹사이트를 차단
    Object.values(CONFIG.blocked_websites).forEach((category) => {
      category.forEach((site) => {
        lines.push(`${CONFIG.system_paths.redirect_ip} ${site}`);
      });
    });

    lines.push(blockEnd);

    // 파일에 쓰기
    fs.writeFileSync(CONFIG.system_paths.hosts_file, lines.join("\n"));

    log("INFO", "hosts 파일 차단 설정 완료");
    return true;
  } catch (error) {
    log("ERROR", `hosts 파일 차단 실패: ${error.message}`);
    return false;
  }
}

function unblockWebsites() {
  try {
    const lines = fs
      .readFileSync(CONFIG.system_paths.hosts_file, "utf8")
      .split("\n");

    const blockStart = "# FocusTimer Block Start";
    const blockEnd = "# FocusTimer Block End";

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(blockStart)) {
        startIdx = i;
      } else if (lines[i].includes(blockEnd)) {
        endIdx = i;
        break;
      }
    }

    if (startIdx !== -1 && endIdx !== -1) {
      lines.splice(startIdx, endIdx - startIdx + 1);
      fs.writeFileSync(CONFIG.system_paths.hosts_file, lines.join("\n"));
      log("INFO", "hosts 파일 차단 해제 완료");
      return true;
    }

    return false;
  } catch (error) {
    log("ERROR", `hosts 파일 차단 해제 실패: ${error.message}`);
    return false;
  }
}

// ----- API 라우트들 -----
app.get("/api/status", (req, res) => {
  res.json({
    isBlockingEnabled,
    blockStats,
    timestamp: new Date().toISOString(),
  });
});

// 차단 상태 확인 API (더 자세한 정보)
app.get("/api/block/status", (req, res) => {
  res.json({
    success: true,
    isBlockingEnabled,
    blockStats,
    userSettings: {
      blockedSites: userSettings.blockedSites,
      blockSchedule: userSettings.blockSchedule,
    },
    message: isBlockingEnabled
      ? "차단 시스템이 활성화되어 있습니다."
      : "차단 시스템이 비활성화되어 있습니다.",
  });
});

app.post("/api/block/start", async (req, res) => {
  try {
    log("INFO", "🚀 차단 시작 요청 받음");

    // 1. hosts 파일 차단
    log("INFO", "📝 hosts 파일 차단 설정 중...");
    const blockSuccess = blockWebsites();
    if (!blockSuccess) {
      return res.status(500).json({
        success: false,
        error: "hosts 파일 차단 실패",
      });
    }

    // 2. 브라우저 재시작 (닫고 다시 열고 창 복구)
    await browserManager.restartBrowsersForBlocking();

    // 상태 업데이트
    isBlockingEnabled = true;
    blockStats.totalBlocks++;
    blockStats.todayBlocks++;

    // 차단 히스토리 저장
    userSettings.blockHistory.push({
      action: "차단 시작",
      timestamp: new Date().toISOString(),
      details: {
        blockedSites: userSettings.blockedSites.length,
        schedule: userSettings.blockSchedule,
      },
    });
    saveUserSettings();

    log("INFO", "✅ 차단 시작 완료");
    res.json({
      success: true,
      message: "집중 모드 차단이 시작되었습니다.",
      blockStats,
    });
  } catch (error) {
    log("ERROR", `❌ 차단 시작 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/block/stop", async (req, res) => {
  try {
    log("INFO", "🛑 차단 중지 요청 받음");

    // 1. hosts 파일 차단 해제
    log("INFO", "📝 hosts 파일 차단 해제 중...");
    const unblockSuccess = unblockWebsites();
    if (!unblockSuccess) {
      return res.status(500).json({
        success: false,
        error: "hosts 파일 차단 해제 실패",
      });
    }

    // 2. 브라우저 새로고침만 (종료/재시작 없음)
    await browserManager.refreshBrowsersForUnblocking();

    // 상태 업데이트
    isBlockingEnabled = false;

    // 차단 히스토리 저장
    userSettings.blockHistory.push({
      action: "차단 중지",
      timestamp: new Date().toISOString(),
      details: {
        duration: "사용자 요청",
      },
    });
    saveUserSettings();

    log("INFO", "✅ 차단 중지 완료");
    res.json({
      success: true,
      message: "집중 모드 차단이 중지되었습니다.",
      blockStats,
    });
  } catch (error) {
    log("ERROR", `❌ 차단 중지 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/block/sites", (req, res) => {
  const allSites = [];
  Object.entries(CONFIG.blocked_websites).forEach(([category, sites]) => {
    sites.forEach((site) => {
      allSites.push({
        domain: site,
        name: site.replace("www.", ""),
        category: category,
      });
    });
  });

  res.json({
    sites: allSites,
  });
});

// 사용자 설정 관련 API
app.get("/api/settings", (req, res) => {
  res.json({
    success: true,
    settings: userSettings,
  });
});

// 차단 사이트 설정 저장
app.post("/api/settings/blocked-sites", (req, res) => {
  try {
    const { blockedSites } = req.body;
    userSettings.blockedSites = blockedSites;
    saveUserSettings();

    log("INFO", `차단 사이트 설정 저장 완료 (${blockedSites.length}개 사이트)`);

    res.json({
      success: true,
      message: "차단 사이트 설정이 저장되었습니다.",
      settings: userSettings.blockedSites,
    });
  } catch (error) {
    log("ERROR", `차단 사이트 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 스케줄 설정 저장
app.post("/api/settings/block-schedule", (req, res) => {
  try {
    const { blockSchedule } = req.body;
    userSettings.blockSchedule = blockSchedule;
    saveUserSettings();

    log("INFO", "차단 스케줄 설정 저장 완료");

    res.json({
      success: true,
      message: "차단 스케줄 설정이 저장되었습니다.",
      settings: userSettings.blockSchedule,
    });
  } catch (error) {
    log("ERROR", `차단 스케줄 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 포모도로 설정 저장
app.post("/api/settings/pomodoro", (req, res) => {
  try {
    const { pomodoroSettings } = req.body;
    userSettings.pomodoroSettings = pomodoroSettings;
    saveUserSettings();

    log("INFO", "포모도로 설정 저장 완료");

    res.json({
      success: true,
      message: "포모도로 설정이 저장되었습니다.",
      settings: userSettings.pomodoroSettings,
    });
  } catch (error) {
    log("ERROR", `포모도로 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 히스토리 저장
app.post("/api/settings/block-history", (req, res) => {
  try {
    const { action, timestamp, details } = req.body;
    const historyEntry = {
      action,
      timestamp: timestamp || new Date().toISOString(),
      details,
    };

    userSettings.blockHistory.push(historyEntry);

    // 히스토리 최대 100개까지만 유지
    if (userSettings.blockHistory.length > 100) {
      userSettings.blockHistory = userSettings.blockHistory.slice(-100);
    }

    saveUserSettings();

    log("INFO", `차단 히스토리 저장 완료: ${action}`);

    res.json({
      success: true,
      message: "차단 히스토리가 저장되었습니다.",
      history: historyEntry,
    });
  } catch (error) {
    log("ERROR", `차단 히스토리 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 히스토리 조회
app.get("/api/settings/block-history", (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = userSettings.blockHistory.slice(-parseInt(limit)).reverse();

    res.json({
      success: true,
      history,
      total: userSettings.blockHistory.length,
    });
  } catch (error) {
    log("ERROR", `차단 히스토리 조회 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 설정 초기화
app.post("/api/settings/reset", (req, res) => {
  try {
    userSettings = {
      blockedSites: [],
      blockSchedule: {
        startTime: "09:00",
        endTime: "18:00",
        days: ["월", "화", "수", "목", "금"],
      },
      pomodoroSettings: {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      },
      blockHistory: [],
    };

    saveUserSettings();

    log("INFO", "사용자 설정 초기화 완료");

    res.json({
      success: true,
      message: "설정이 초기화되었습니다.",
      settings: userSettings,
    });
  } catch (error) {
    log("ERROR", `설정 초기화 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  log("INFO", `차단 서버가 포트 ${PORT}에서 실행 중입니다.`);
  log("INFO", `API 엔드포인트:`);
  log("INFO", `- GET  /api/status - 현재 상태 조회`);
  log("INFO", `- POST /api/block/start - 차단 시작`);
  log("INFO", `- POST /api/block/stop - 차단 중지`);
  log("INFO", `- GET  /api/block/sites - 차단 사이트 목록`);
  log("INFO", `설정 관리 API:`);
  log("INFO", `- GET  /api/settings - 전체 설정 조회`);
  log("INFO", `- POST /api/settings/blocked-sites - 차단 사이트 설정 저장`);
  log("INFO", `- POST /api/settings/block-schedule - 차단 스케줄 설정 저장`);
  log("INFO", `- POST /api/settings/pomodoro - 포모도로 설정 저장`);
  log("INFO", `- GET  /api/settings/block-history - 차단 히스토리 조회`);
  log("INFO", `- POST /api/settings/reset - 설정 초기화`);
});

module.exports = app;
