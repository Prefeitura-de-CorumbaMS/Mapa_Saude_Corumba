import { Table } from 'antd'
import { useGetEspecialidadesQuery } from '../../store/slices/apiSlice'

export default function EspecialidadesPage() {
  const { data, isLoading } = useGetEspecialidadesQuery()
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
  ]
  
  return (
    <div>
      <h1>Especialidades</h1>
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
