interface BtnProps {
  label?: string;
  onClick: () => void;
}

const Btn: React.FC<BtnProps> = ({ label, onClick, children }) => {
  const preventDefault = (e: React.KeyboardEvent) => {
    e.preventDefault();
  };

  return (
    <button
      className={`vp-btn${label ? ' label' : ''}`}
      data-label={label}
      onClick={onClick}
      onKeyDown={preventDefault}
    >
      {children}
    </button>
  );
};

export default Btn;
