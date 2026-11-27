import { notifications } from '@mantine/notifications';

/** DASH-61: success messages are announced politely and never take focus. */
export function notifySuccess(message: string): void {
  notifications.show({ message, color: 'green', role: 'status', autoClose: 4000 });
}

export function notifyError(message: string): void {
  notifications.show({ message, color: 'red', role: 'alert', autoClose: 6000 });
}
