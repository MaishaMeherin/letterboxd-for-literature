import { Avatar, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';

const items = [
  { key: 'profile', label: 'View Profile' },
  { key: 'logout',  label: 'Logout', danger: true },
];

function Navbar() {
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') navigate('/user/me');
    if (key === 'logout')  { /* clear tokens */ navigate('/login'); }
  };

  return (
    <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomLeft">
      <Avatar style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}>M</Avatar>
    </Dropdown>
  );
}

export default Navbar;
