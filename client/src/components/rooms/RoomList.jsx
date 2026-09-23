import { EmptyState, SkeletonRoomGrid } from '../common/AsyncState';
import { RoomCard } from './RoomCard';

export function RoomList({ rooms, loading, emptyTitle = 'Không tìm thấy phòng phù hợp', emptyDescription = 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc mở rộng khu vực.', selectedIds = [], onCompareChange, onSelect, compact = false }) {
  if (loading) return <SkeletonRoomGrid count={compact ? 2 : 6} />;
  if (!rooms?.length) return <EmptyState icon="bi-search" title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="row g-3 content-visibility-auto">
      {rooms.map((room) => (
        <div className={compact ? 'col-12' : 'col-md-6 col-xl-4'} key={room.id}>
          <RoomCard room={room} compact={compact} selectedForCompare={selectedIds.includes(String(room.id))} onCompareChange={onCompareChange} onSelect={() => onSelect?.(room)} />
        </div>
      ))}
    </div>
  );
}
