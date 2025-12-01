import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NotificationService = {
  async requestPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    }
    return true;
  },

  // 2. Agendar notificação diária
  async scheduleDailyReminder(timeString: string) { // formato "HH:mm"
    // Primeiro, removemos agendamentos anteriores para não duplicar
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
        console.log("Sem permissão para notificações");
        return;
    }

    const [hours, minutes] = timeString.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Como você está se sentindo? 📝",
        body: "Tire um momento para registrar seu humor no MoodFlow.",
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true, // Repete todo dia nesse horário
        type: Notifications.SchedulableTriggerInputTypes.DAILY
      },
    });

    console.log(`Lembrete agendado para ${hours}:${minutes}`);
  },

  // 3. Cancelar todas as notificações (quando o usuário desativa)
  async cancelReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Lembretes cancelados");
  }
};
