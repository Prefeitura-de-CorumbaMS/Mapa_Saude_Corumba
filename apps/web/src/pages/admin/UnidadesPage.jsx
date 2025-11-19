import { useState } from 'react'
import { Table, Button, Space, Tag } from 'antd'
import { useGetUnidadesQuery } from '../../store/slices/apiSlice'

export default function UnidadesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetUnidadesQuery({ page, limit: 20 })
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Endereço', dataIndex: 'endereco', key: 'endereco' },
    { title: 'Latitude', dataIndex: 'latitude', key: 'latitude', width: 120 },
    { title: 'Longitude', dataIndex: 'longitude', key: 'longitude', width: 120 },
    { 
      title: 'Status', 
      dataIndex: 'ativo', 
      key: 'ativo',
      render: (ativo) => <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      render: () => (
        <Space>
          <Button size="small">Editar</Button>
          <Button size="small" danger>Excluir</Button>
        </Space>
      ),
    },
  ]
  
  return (
    <div>
      <h1>Unidades de Saúde</h1>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination?.total || 0,
          onChange: setPage,
        }}
      />
    </div>
  )
}
