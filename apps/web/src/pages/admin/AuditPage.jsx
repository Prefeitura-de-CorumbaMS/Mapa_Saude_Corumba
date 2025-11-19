import { useState } from 'react'
import { Table, Tag } from 'antd'
import { useGetAuditLogsQuery } from '../../store/slices/apiSlice'
import dayjs from 'dayjs'

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAuditLogsQuery({ page, limit: 50 })
  
  const operationColors = {
    INSERT: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
  }
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tabela', dataIndex: 'tabela', key: 'tabela' },
    { 
      title: 'Operação', 
      dataIndex: 'operacao', 
      key: 'operacao',
      render: (op) => <Tag color={operationColors[op]}>{op}</Tag>
    },
    { title: 'Registro ID', dataIndex: 'registro_id', key: 'registro_id' },
    { 
      title: 'Usuário', 
      dataIndex: ['user', 'username'], 
      key: 'user',
      render: (_, record) => record.user?.username || 'Sistema'
    },
    { 
      title: 'Data/Hora', 
      dataIndex: 'timestamp', 
      key: 'timestamp',
      render: (timestamp) => dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss')
    },
  ]
  
  return (
    <div>
      <h1>Logs de Auditoria</h1>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.pagination?.total || 0,
          onChange: setPage,
        }}
      />
    </div>
  )
}
