import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRef } from "react";
import {
  Icon,
  MD3Theme,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { AppSettings } from "../storage";
import { isScienceClass, scheduleEmoji } from "../utils";
import { styles } from "../styles";

type Props = {
  theme: MD3Theme;
  settings: AppSettings;
  onChange: (settings: AppSettings) => Promise<void>;
};

const periods = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function SettingsScreen({ theme, settings, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const setAppearance = (appearance: AppSettings["appearance"]) =>
    void onChange({ ...settings, appearance });
  const updateName = (period: string, name: string) =>
    void onChange({
      ...settings,
      customNames: { ...settings.customNames, [period]: name },
    });
  const updateAdvisory = (period: string, enabled: boolean) =>
    void onChange({
      ...settings,
      advisoryPeriods: { ...settings.advisoryPeriods, [period]: enabled },
    });
  const updateExtension = (
    period: string,
    mode: "none" | "forward" | "backward",
  ) =>
    void onChange({
      ...settings,
      extensionModes: { ...settings.extensionModes, [period]: mode },
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoiding}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text
        variant="headlineMedium"
        style={[styles.screenTitle, { color: theme.colors.onBackground }]}
      >
        Settings
      </Text>

      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        Appearance
      </Text>
      <SegmentedButtons
        value={settings.appearance}
        onValueChange={(value) =>
          setAppearance(value as AppSettings["appearance"])
        }
        buttons={[
          { value: "system", label: "System", icon: "theme-light-dark" },
          { value: "light", label: "Light", icon: "white-balance-sunny" },
          { value: "dark", label: "Dark", icon: "moon-waning-crescent" },
        ]}
      />

      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        Change Class Names
      </Text>
      {periods.map((period) => {
        const name = settings.customNames[period] ?? "";
        const scienceClass = isScienceClass(name);
        const isLunch = name.toLowerCase().includes("lunch");
        return (
          <View key={period} style={styles.settingsCard}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Period {period}
            </Text>
            <View
              style={[
                styles.settingsEditor,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <TextInput
                mode="flat"
                label="Class name"
                value={name}
                onChangeText={(value) => updateName(period, value)}
                onFocus={() => {
                  const periodIndex = periods.indexOf(period);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, periodIndex * 150),
                      animated: true,
                    });
                  }, 250);
                }}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Text style={styles.inputEmoji}>
                        {scheduleEmoji("class", name || `Period ${period}`)}
                      </Text>
                    )}
                  />
                }
                style={styles.settingsInput}
              />
              {isLunch && (
                <View style={styles.settingRow}>
                  <View style={[styles.settingLabel, {marginLeft: 12}]}>
                    <Icon
                      source="account-school-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                    >
                      Advisory first half
                    </Text>
                  </View>
                  <Switch
                    value={settings.advisoryPeriods[period] ?? false}
                    onValueChange={(enabled) => updateAdvisory(period, enabled)}
                  />
                </View>
              )}
              {scienceClass && (
                <>
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.optionLabel,
                      { color: theme.colors.onSurfaceVariant, marginLeft: 5 },
                    ]}
                  >
                    Extra 0.5 period extension
                  </Text>
                  <SegmentedButtons
                    value={settings.extensionModes[period] ?? "none"}
                    onValueChange={(value) =>
                      updateExtension(
                        period,
                        value as "none" | "forward" | "backward",
                      )
                    }
                    buttons={[
                      { value: "backward", label: "Back", icon: "arrow-left" },
                      { value: "none", label: "Normal", icon: "minus" },
                      {
                        value: "forward",
                        label: "Forward",
                        icon: "arrow-right",
                      },
                    ]}
                  />
                </>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
