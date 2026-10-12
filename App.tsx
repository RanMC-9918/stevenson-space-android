import { StatusBar } from "expo-status-bar";
import * as Brightness from "expo-brightness";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Icon,
  IconButton,
  PaperProvider,
  Surface,
  Text,
} from "react-native-paper";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LunchScreen } from "./src/screens/LunchScreen";
import { IdScreen } from "./src/screens/IdScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import {
  getChicagoDateKey,
  getMomentState,
  resolveToday,
} from "./src/schedule";
import { fetchLiveLunchManifest } from "./src/lunch";
import { fetchScheduleDates } from "./src/stevenson";
import {
  AppSettings,
  loadLunchManifest,
  loadSavedId,
  loadScheduleCache,
  loadSettings,
  saveLunchManifest,
  saveScheduleCache,
  saveSettings,
  SavedId,
  shouldSync,
} from "./src/storage";
import { darkTheme, lightTheme } from "./src/theme";
import {
  requestNotificationPermission,
  scheduleNextClassNotifications,
} from "./src/notifications";
import { styles } from "./src/styles";
import { Tab } from "./src/types";

export default function App() {
  const systemScheme = useColorScheme();
  const [tab, setTab] = useState<Tab>("Home");
  const [now, setNow] = useState(() => new Date());
  const [devMode, setDevMode] = useState(false);
  const [devTimeOffsetMinutes, setDevTimeOffsetMinutes] = useState(0);
  const [timerTapCount, setTimerTapCount] = useState(0);
  const [remoteDates, setRemoteDates] = useState<Record<string, string>>({});
  const [syncState, setSyncState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [settings, setSettings] = useState<AppSettings>({
    appearance: "dark",
    customNames: {},
    extensionModes: {},
    advisoryPeriods: {},
  });
  const [savedId, setSavedId] = useState<SavedId | null>(null);
  const [idEditing, setIdEditing] = useState(false);
  const brightnessTask = useRef(Promise.resolve());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [previousSelectedDate, setPreviousSelectedDate] = useState<string | null | undefined>(undefined);
  const [liveLunchStatus, setLiveLunchStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [liveLunchManifest, setLiveLunchManifest] = useState<any>(null);
  const isDark =
    settings.appearance === "dark" ||
    (settings.appearance === "system" && systemScheme !== "light");
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    void Promise.all([
      loadScheduleCache().then(setRemoteDates),
      loadSettings().then(setSettings),
      loadSavedId().then(setSavedId),
      loadLunchManifest().then((value) =>
        setLiveLunchManifest(value?.manifest ?? null),
      ),
    ]);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const queue = (task: () => Promise<void>) => {
      brightnessTask.current = brightnessTask.current
        .catch(() => undefined)
        .then(task)
        .catch((error: unknown) =>
          console.warn("Unable to update screen brightness.", error),
        );
    };
    if (tab !== "ID" || !savedId?.idNumber || idEditing) return;
    const boost = () => queue(() => Brightness.setBrightnessAsync(1));
    const restore = () =>
      queue(() => Brightness.restoreSystemBrightnessAsync());
    void boost();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void boost();
      else void restore();
    });
    return () => {
      subscription.remove();
      void restore();
    };
  }, [tab, savedId?.idNumber, idEditing]);
  const refreshSchedule = async (force = false) => {
    if (!force && !(await shouldSync())) return;
    setSyncState("loading");
    try {
      const dates = await fetchScheduleDates();
      await saveScheduleCache(dates);
      setRemoteDates(dates);
      setSyncState("idle");
    } catch {
      setSyncState("error");
    }
  };
  useEffect(() => {
    void refreshSchedule();
  }, []);
  const refreshLunch = async () => {
    setLiveLunchStatus("loading");
    try {
      const manifest = await fetchLiveLunchManifest();
      await saveLunchManifest(manifest);
      setLiveLunchManifest(manifest);
      setLiveLunchStatus("ready");
    } catch {
      setLiveLunchStatus("error");
    }
  };
  const effectiveNow = useMemo(
    () => new Date(now.getTime() + devTimeOffsetMinutes * 60 * 1000),
    [now, devTimeOffsetMinutes],
  );
  const dayKey = getChicagoDateKey(effectiveNow);
  const viewedDate = selectedDate ?? dayKey;
  const timeline = useMemo(
    () => resolveToday(viewedDate, remoteDates, settings.customNames, settings),
    [viewedDate, remoteDates, settings],
  );
  const nextSchoolDay = useMemo(() => {
    let candidate = dayKey;
    for (let offset = 1; offset <= 14; offset += 1) {
      candidate = shiftDate(candidate, 1);
      const next = resolveToday(candidate, remoteDates, settings.customNames, settings);
      if (next.isSchoolDay) return next;
    }
    return undefined;
  }, [dayKey, remoteDates, settings]);
  const moment = useMemo(
    () => getMomentState(effectiveNow, timeline, nextSchoolDay),
    [effectiveNow, timeline, nextSchoolDay],
  );
  useEffect(() => {
    void requestNotificationPermission().then((granted) => {
      if (granted) void scheduleNextClassNotifications(timeline);
    });
  }, [timeline]);
  const updateSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
  };
  const iconFor = (item: Tab) =>
    item === "Home"
      ? "home-variant"
      : item === "Calendar"
        ? "calendar-month"
        : item === "Lunch"
        ? "silverware-fork-knife"
        : item === "ID"
          ? "card-account-details"
          : "cog";
  const handleTimerTap = () => {
    if (devMode) return;
    const nextCount = timerTapCount + 1;
    if (nextCount >= 10) {
      setDevMode(true);
      setTimerTapCount(0);
    } else {
      setTimerTapCount(nextCount);
    }
  };
  const handleReturnState = () => {
    if (devMode) {
      setDevMode(false);
      return;
    }
    setSelectedDate(previousSelectedDate ?? null);
    setPreviousSelectedDate(undefined);
    setTab("Home");
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (devMode) {
        setDevMode(false);
        return true;
      }
      if (tab === "Calendar") {
        setTab("Home");
        return true;
      }
      if (tab === "Home" && selectedDate !== null) {
        setSelectedDate(previousSelectedDate ?? null);
        setPreviousSelectedDate(undefined);
        return true;
      }
      if (tab !== "Home") {
        setTab("Home");
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [devMode, previousSelectedDate, selectedDate, tab]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.content}>
          {tab === "Home" && (
            <HomeScreen
              theme={theme}
              timeline={timeline}
              onOpenDatePicker={() => setTab("Calendar")}
              moment={moment}
              now={effectiveNow}
              syncState={syncState}
              onRefresh={() => refreshSchedule(true)}
              devMode={devMode}
              devTimeOffsetMinutes={devTimeOffsetMinutes}
              onTimerTap={handleTimerTap}
              onChangeDevTime={(minutes) => setDevTimeOffsetMinutes((value) => value + minutes)}
              onResetDevTime={() => setDevTimeOffsetMinutes(0)}
              onReturnToday={handleReturnState}
            />
          )}
          {tab === "Calendar" && (
            <CalendarScreen
              theme={theme}
              dates={remoteDates}
              selectedDate={viewedDate}
              onSelectDate={(dateKey) => {
                setPreviousSelectedDate(viewedDate);
                setSelectedDate(dateKey);
                setTab("Home");
              }}
            />
          )}
          {tab === "Lunch" && (
            <LunchScreen
              theme={theme}
              dateKey={viewedDate}
              status={liveLunchStatus}
              manifest={liveLunchManifest}
              onRefresh={refreshLunch}
              onOpenDatePicker={() => setTab("Calendar")}
            />
          )}
          {tab === "ID" && (
            <IdScreen
              theme={theme}
              savedId={savedId}
              onSaved={setSavedId}
              editing={idEditing}
              onEditingChange={setIdEditing}
            />
          )}
          {tab === "Settings" && (
            <SettingsScreen
              theme={theme}
              settings={settings}
              onChange={updateSettings}
            />
          )}
        </View>
        <View style={styles.floatingNavigation}>
          {(["Home", "Calendar", "Lunch", "ID", "Settings"] as Tab[]).map((item) => (
            <Surface
              key={item}
              elevation={1}
              style={[
                styles.destination,
                tab === item && {
                  backgroundColor: theme.colors.secondaryContainer,
                },
              ]}
            >
              <IconButton
                icon={iconFor(item)}
                size={22}
                iconColor={
                  tab === item
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant
                }
                onPress={() => setTab(item)}
                accessibilityLabel={item}
              />
              {tab === item && (
                <Text
                  variant="labelMedium"
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    marginRight: 12,
                  }}
                >
                  {item}
                </Text>
              )}
            </Surface>
          ))}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

function shiftDate(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}
