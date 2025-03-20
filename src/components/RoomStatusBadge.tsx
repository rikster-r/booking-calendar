type Props = {
  status: 'ready' | 'not ready' | 'cleaning';
};

const RoomStatusBadge = ({ status }: Props) => {
  const statusMap = {
    ready: {
      className: 'bg-green-500',
    },
    'not ready': {
      className: 'bg-red-500',
    },
    cleaning: {
      className: 'bg-yellow-500',
    },
  };

  const data = statusMap[status];

  return (
    <div className="flex items-center gap-1 rounded-lg text-xs text-white font-medium text-nowrap">
      <div className={`w-2 h-2 rounded-full shadow-xl ring-2 ring-white ${data.className}`}></div>
    </div>
  );
};

export default RoomStatusBadge;
