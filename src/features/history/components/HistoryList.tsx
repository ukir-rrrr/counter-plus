import { FlatList, Text, View } from 'react-native';

import type { HistoryListItem } from '../group';

const badgeTone = {
  increment: 'bg-accent-soft text-accent-ink',
  decrement: 'bg-neutral-button text-ink-muted',
  edit: 'bg-badge-edit text-badge-edit-ink',
  reset: 'bg-badge-edit text-badge-edit-ink',
} as const;

export function HistoryList({
  items,
  emptyMessage,
}: {
  items: HistoryListItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <View testID="history-empty" className="mx-screen flex-1 items-center justify-center px-4">
        <Text className="text-center font-sans text-body text-ink-muted">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="history-list"
      data={items}
      keyExtractor={(item) => item.key}
      contentContainerClassName="px-screen gap-1.5 pb-2"
      renderItem={({ item, index }) =>
        item.kind === 'heading' ? (
          <Text
            accessibilityRole="header"
            className="px-1 pb-0.5 pt-2 font-sans-medium text-label text-ink-muted">
            {item.label}
          </Text>
        ) : (
          <HistoryEventRow item={item} index={index} />
        )
      }
    />
  );
}

function HistoryEventRow({
  item,
  index,
}: {
  item: Extract<HistoryListItem, { kind: 'event' }>;
  index: number;
}) {
  const { event, time, badge } = item;
  return (
    <View
      testID={`history-event-${index}`}
      accessible
      accessibilityLabel={`${time} ${event.counterName} ${event.categoryName} ${badge.label} ${event.countAfter}`}
      className="min-h-[52px] flex-row items-center gap-2.5 rounded-control border border-border bg-surface px-3.5">
      <Text
        testID={`history-event-time-${index}`}
        numberOfLines={1}
        className="min-w-10 shrink-0 font-mono-medium text-label tabular-nums text-ink-muted">
        {time}
      </Text>
      <View accessible={false} className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-sans-medium text-body-sm text-ink">
          {event.counterName}
        </Text>
        <Text numberOfLines={1} className="font-sans text-hint text-ink-subtle">
          {event.categoryName}
        </Text>
      </View>
      <Text
        className={`min-w-11 shrink-0 rounded px-2 py-0.5 text-center font-mono-semibold text-body-sm ${badgeTone[badge.kind]}`}>
        {badge.label}
      </Text>
      <Text className="w-[52px] shrink-0 text-right font-mono-medium text-body-sm text-ink-muted">
        → {event.countAfter}
      </Text>
    </View>
  );
}
