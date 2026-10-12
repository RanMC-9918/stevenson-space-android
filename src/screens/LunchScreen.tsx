import { RefreshControl, ScrollView, View } from 'react-native';
import { Card, MD3Theme, Text } from 'react-native-paper';
import { DateLink } from '../components/DateLink';
import { getLunch } from '../lunch';
import { dateFromKey, formatStation } from '../utils';
import { styles } from '../styles';

type Props = { theme: MD3Theme; dateKey: string; status: 'idle' | 'loading' | 'ready' | 'error'; manifest: any; onRefresh: () => Promise<void>; onOpenDatePicker: () => void };

export function LunchScreen({ theme, dateKey, status, manifest, onRefresh, onOpenDatePicker }: Props) {
  const menu = getLunch(dateKey, manifest ?? undefined);
  const dateLabel = dateFromKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={() => void onRefresh()} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}>
    <Text variant="headlineMedium" style={[styles.screenTitle, { color: theme.colors.onBackground }]}>Lunch menu</Text>
    <DateLink theme={theme} label={dateLabel} onPress={onOpenDatePicker} />
    {status === 'error' && <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>Live update failed; showing the bundled menu.</Text>}
    {status === 'ready' && <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 8 }}>Live menu data updated.</Text>}
    {!menu ? <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 20 }}>No lunch menu is available for this day.</Text> : menu.sections.map((section) => <Card key={section.station} mode="contained" style={[styles.menuCard, { backgroundColor: theme.colors.surfaceVariant }]}><Card.Content><Text variant="titleMedium" style={{ color: theme.colors.primary }}>{formatStation(section.station)}</Text>{section.items.map((item) => <Text key={item} variant="bodyLarge" style={{ color: theme.colors.onSurface, marginTop: 8 }}>{item}</Text>)}</Card.Content></Card>)}
  </ScrollView>;
}
