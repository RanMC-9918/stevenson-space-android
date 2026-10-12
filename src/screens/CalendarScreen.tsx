import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, IconButton, MD3Theme, Surface, Text } from 'react-native-paper';
import { dateFromKey, dateToKey } from '../utils';
import { styles } from '../styles';

type Props = {
  theme: MD3Theme;
  dates: Record<string, string>;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
};

export function CalendarScreen({ theme, dates, selectedDate, onSelectDate }: Props) {
  const [month, setMonth] = useState(() => {
    const date = dateFromKey(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = dateToKey(new Date());
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.calendarHeader}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          accessibilityLabel="Previous month"
        />
        <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>{monthLabel}</Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          accessibilityLabel="Next month"
        />
      </View>
      <View style={styles.weekHeader}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.calendarWeekday}>{day}</Text>)}</View>
      <Surface mode="flat" style={[styles.calendarGrid, { backgroundColor: theme.colors.surfaceVariant }]}>
        {cells.map((date) => {
          const key = dateToKey(date);
          const label = (dates[key] ?? '').toLowerCase();
          const inMonth = date.getMonth() === month.getMonth();
          const selected = key === selectedDate;
          const isToday = key === today;
          const late = label.includes('late');
          const activity = label.includes('activity');
          const eventText = late
            ? theme.colors.onTertiaryContainer
            : activity
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurfaceVariant;
          const dayBackground = late
            ? theme.colors.tertiaryContainer
            : activity
              ? theme.colors.primaryContainer
              : 'transparent';
          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(key)}
              style={[
                styles.calendarDay,
                { backgroundColor: dayBackground },
                !inMonth && { opacity: 0.35 },
              ]}
            >
              <View style={[
                styles.calendarNumber,
                isToday && { backgroundColor: '#D32F2F' },
                selected && { borderColor: '#FFFFFF', borderWidth: 2 },
              ]}>
                <Text style={{
                  color: isToday ? '#FFFFFF' : eventText,
                }}>
                {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Surface>
      <View style={styles.calendarLegend}>
        <View style={styles.calendarLegendItem}>
          <View style={[styles.calendarLegendKey, styles.calendarTodayKey]} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Today</Text>
        </View>
        <View style={styles.calendarLegendItem}>
          <View style={[styles.calendarLegendKey, styles.calendarSelectedKey]} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Selected</Text>
        </View>
        <View style={styles.calendarLegendItem}>
          <View style={[styles.calendarLegendKey, { backgroundColor: theme.colors.tertiaryContainer }]} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Late arrival</Text>
        </View>
        <View style={styles.calendarLegendItem}>
          <View style={[styles.calendarLegendKey, { backgroundColor: theme.colors.primaryContainer }]} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Activity period</Text>
        </View>
      </View>
      <Button mode="contained-tonal" icon="calendar-today" onPress={() => onSelectDate(today)}>Return to today</Button>
    </ScrollView>
  );
}
