type Props = {
  status: 'ready' | 'not ready' | 'cleaning';
};

const RoomStatusBadge = ({ status }: Props) => {
  const statusMap = {
    ready: {
      text: 'Готово',
    },
    'not ready': {
      text: 'Не готово',
    },
    cleaning: {
      text: 'Уборка',
    },
  };

  const data = statusMap[status];

  return (
    <div className="flex items-center gap-1 rounded-lg text-xs text-white font-medium text-nowrap">
      <span className={`w-1 h-1 rounded-full bg-white`}></span>
      <span>{data.text}</span>
    </div>
  );
};

export default RoomStatusBadge;
