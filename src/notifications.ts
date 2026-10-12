import * as Notifications from 'expo-notifications';
import { Timeline } from './schedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleNextClassNotifications(timeline: Timeline) {
  await Notifications.setNotificationChannelAsync('schedule', {
    name: 'Class schedule',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
  });
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const block of timeline.blocks.slice(0, 8)) {
    const [hour, minute] = block.start.split(':').map(Number);
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);
    const notificationTime = triggerDate.getTime() - 5 * 60 * 1000;
    if (notificationTime <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: `${block.name} starts soon`, body: `${block.start} – ${block.end}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(notificationTime) },
    });
  }
  return true;
}

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}
