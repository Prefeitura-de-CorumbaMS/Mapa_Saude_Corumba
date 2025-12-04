import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
  AuditOutlined,
  SyncOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { logout } from '../store/slices/authSlice'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  
  const isSuperadmin = user?.role === 'superadmin'
  
  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Painel' },
    { key: '/admin/staging', icon: <DatabaseOutlined />, label: 'Área de Staging (Arquivo)' },
    { key: '/admin/unidades', icon: <EnvironmentOutlined />, label: 'Unidades' },
    { key: '/admin/medicos', icon: <MedicineBoxOutlined />, label: 'Médicos' },
    { key: '/admin/especialidades', icon: <TeamOutlined />, label: 'Especialidades' },
    { key: '/admin/especialidades-normalizacao', icon: <TagsOutlined />, label: 'Normalização (Arquivo)' },
    { key: '/admin/icones', icon: <PictureOutlined />, label: 'Ícones' },
    { key: '/admin/bairros', icon: <EnvironmentOutlined />, label: 'Bairros' },
    ...(isSuperadmin ? [
      { key: '/admin/users', icon: <UserOutlined />, label: 'Usuários' },
      { key: '/admin/audit', icon: <AuditOutlined />, label: 'Auditoria' },
      { key: '/admin/etl', icon: <SyncOutlined />, label: 'ETL (Arquivo)' },
    ] : []),
  ]
  
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }
  
  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sair',
        onClick: handleLogout,
      },
    ],
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '18px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'SIGLS' : 'Painel SIGLS'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
