/**
 * Centralized notification destination resolver.
 * Routes user safely to TaskDetailDrawer or relevant portal workflow.
 */
export function handleNotificationClick({
  notification,
  onOpenTaskDetail,
  navigate,
  onClosePopover,
  markAsRead,
}) {
  if (!notification) return;

  // 1. Mark as read immediately
  if (notification.id && markAsRead) {
    markAsRead(notification.id);
  }

  // 2. Close the popover
  if (onClosePopover) {
    onClosePopover();
  }

  // 3. Resolve Destination
  const destination = notification.destination;

  if (destination?.type === 'task' && destination?.taskId) {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && navigate) {
      navigate(`/tasks/${destination.taskId}`);
    } else if (onOpenTaskDetail) {
      onOpenTaskDetail(destination.taskId);
    } else if (navigate) {
      navigate(`/tasks/${destination.taskId}`);
    }
    return;
  }

  if (destination?.type === 'inbox') {
    if (navigate) {
      const queryParam = destination.subtype ? `?type=${destination.subtype}` : '';
      navigate(`/inbox${queryParam}`);
    }
    return;
  }

  if (destination?.type === 'activity') {
    if (navigate) {
      navigate('/activity');
    }
    return;
  }

  if (notification.link && navigate) {
    navigate(notification.link);
  }
}
