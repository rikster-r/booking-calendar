import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RoomStatusBadge from './RoomStatusBadge';

type Props = {
  room: Room;
  onClick: () => void;
  maxNameLength: number;
};

export default function SortableRoomItem({
  room,
  onClick,
  maxNameLength,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: room.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    position: isDragging ? 'relative' : 'inherit',
    zIndex: isDragging ? 1000 : 0,
    cursor: isDragging ? 'grabbing' : 'pointer',
    touchAction: 'none',
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        style={{ backgroundColor: room.color }}
        className="text-white p-2 lg:p-3 rounded-lg text-center h-[38px] lg:h-[45px] flex items-center justify-center shadow-md text-[10px] lg:text-xs gap-1 w-[120px] lg:w-[180px]"
      >
        <span className="font-semibold text-nowrap">
          {room.name.length > maxNameLength
            ? `${room.name.slice(0, maxNameLength)}...`
            : room.name}
        </span>
        <RoomStatusBadge room={room} />
      </div>
    </button>
  );
}
