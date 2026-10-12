import { RefreshControl, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Icon,
  IconButton,
  MD3Theme,
  Surface,
  Text,
} from "react-native-paper";
import { DateLink } from "../components/DateLink";
import { getChicagoDateKey, getMomentState, resolveToday } from "../schedule";
import { formatCountdown, scheduleEmoji } from "../utils";
import { styles } from "../styles";

type Props = {
  theme: MD3Theme;
  timeline: ReturnType<typeof resolveToday>;
  onOpenDatePicker: () => void;
  moment: ReturnType<typeof getMomentState>;
  now: Date;
  syncState: "idle" | "loading" | "error";
  onRefresh: () => Promise<void>;
  devMode: boolean;
  devTimeOffsetMinutes: number;
  onTimerTap: () => void;
  onChangeDevTime: (minutes: number) => void;
  onResetDevTime: () => void;
  onReturnToday: () => void;
};

export function HomeScreen({
  theme,
  timeline,
  onOpenDatePicker,
  moment,
  now,
  syncState,
  onRefresh,
  devMode,
  devTimeOffsetMinutes,
  onTimerTap,
  onChangeDevTime,
  onResetDevTime,
  onReturnToday,
}: Props) {
  const viewedDate = new Date(`${timeline.dateKey}T12:00:00`);
  const currentDate = new Date(`${getChicagoDateKey(now)}T12:00:00`);
  const dayOffset = Math.round(
    (viewedDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000),
  );
  const currentMinutes = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now).find((part) => part.type === "hour")?.value ?? 0) * 60
    + Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now).find((part) => part.type === "minute")?.value ?? 0);
  const isCurrentDay = timeline.dateKey === getChicagoDateKey(now);
  const currentBlock = isCurrentDay
    ? timeline.blocks.find(
        (block) =>
          currentMinutes >= block.startMinutes &&
          currentMinutes < block.endMinutes,
      )
    : undefined;
  const nextBlock = isCurrentDay
    ? timeline.blocks.find((block) => block.startMinutes > currentMinutes)
    : undefined;
  const activeLabel = currentBlock
    ? `${scheduleEmoji(currentBlock.role, currentBlock.name)} ${currentBlock.name} in progress`
    : nextBlock && moment.label === "Up next"
      ? `${scheduleEmoji(nextBlock.role, nextBlock.name)} ${nextBlock.name} up next`
      : moment.label;
  const viewingLabel = dayOffset > 0
    ? "Viewing ahead by"
    : dayOffset < 0
      ? "Viewing behind by"
      : "";
  const viewingAmount = `${Math.abs(dayOffset)} day${Math.abs(dayOffset) === 1 ? "" : "s"}`;
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={syncState === "loading"}
          onRefresh={() => void onRefresh()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <Text
        variant="headlineMedium"
        style={[styles.screenTitle, { color: theme.colors.onBackground }]}
      >
        {timeline.scheduleLabel}
      </Text>
      <DateLink theme={theme} label={timeline.dateLabel} onPress={onOpenDatePicker} />
      <Card
        mode="contained"
        style={[
          styles.heroCard,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              {isCurrentDay ? activeLabel : viewingLabel}
            </Text>
            {isCurrentDay ? (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                LIVE
              </Text>
            ) : (
              <IconButton
                icon="arrow-left"
                size={22}
                iconColor={theme.colors.onPrimaryContainer}
                onPress={onReturnToday}
                style={{ margin: -10}}
                accessibilityLabel="Return to today"
              />
            )}
          </View>
          <Text
            variant="displayMedium"
            onPress={onTimerTap}
            style={{ color: theme.colors.onPrimaryContainer, marginTop: 12 }}
          >
            {isCurrentDay ? formatCountdown(moment.secondsRemaining) : viewingAmount}
          </Text>
          {devMode && (
            <View style={styles.devControls}>
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                Developer clock {devTimeOffsetMinutes >= 0 ? "+" : ""}{devTimeOffsetMinutes} min
              </Text>
              <View style={styles.devButtons}>
                <Button mode="contained-tonal" compact onPress={() => onChangeDevTime(-60)}>-1 hour</Button>
                <Button mode="contained-tonal" compact onPress={() => onChangeDevTime(-10)}>-10 min</Button>
                <Button mode="contained-tonal" compact onPress={() => onChangeDevTime(10)}>+10 min</Button>
                <Button mode="contained-tonal" compact onPress={() => onChangeDevTime(60)}>+1 hour</Button>
              </View>
              <Button mode="text" compact onPress={onResetDevTime}>Reset simulated time</Button>
            </View>
          )}
        </Card.Content>
      </Card>
      <View style={[styles.syncRow, {marginTop: 10}]}>
        <Icon
          source={
            syncState === "error" ? "cloud-off-outline" : "cloud-check-outline"
          }
          size={20}
          color={theme.colors.primary}
        />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1, marginLeft: 8 }}>
          {syncState === "error" ? "Offline · using saved schedule" : "Schedule data is ready"}
        </Text>
      </View>
      <Surface
        mode="flat"
        style={[
          styles.listSurface,
          { backgroundColor: theme.colors.surfaceVariant, marginTop: 16 },
        ]}
      >
        {timeline.blocks.length ? (
          timeline.blocks.map((block, index) => (
            <View key={block.id}>
              {index > 0 && <View style={styles.scheduleDivider} />}
              <View
                style={[
                  styles.scheduleRow,
                  isCurrentDay &&
                    currentMinutes >= block.startMinutes &&
                    currentMinutes < block.endMinutes && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: 18,
                    },
                ]}
              >
                <Text style={styles.scheduleEmoji}>{scheduleEmoji(block.role, block.name)}</Text>
                <View style={styles.rowDetails}>
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {block.name}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {block.start} – {block.end}
                  </Text>
                </View>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {block.period}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 10}}
          >
            There are no scheduled classes today.
          </Text>
        )}
      </Surface>
    </ScrollView>
  );
}
