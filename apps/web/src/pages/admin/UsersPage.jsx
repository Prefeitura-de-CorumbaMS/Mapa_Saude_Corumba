import { Table, Tag } from 'antd'
import { useGetUsersQuery } from '../../store/slices/apiSlice'

export default function UsersPage() {
  const { data, isLoading } = useGetUsersQuery()
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Usuário', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => (
        <Tag color={role === 'superadmin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      )
    },
    { 
      title: 'Status', 
      dataIndex: 'ativo', 
      key: 'ativo',
      render: (ativo) => <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
    },
  ]
  
  return (
    <div>
      <h1>Gerenciamento de Usuários</h1>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
      />
    </div>
  )
}
