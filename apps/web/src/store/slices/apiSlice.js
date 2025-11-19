import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Unidades', 'Medicos', 'Especialidades', 'Staging', 'Users', 'Audit', 'ETL'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    // Unidades
    getUnidades: builder.query({
      query: (params) => ({
        url: '/unidades',
        params,
      }),
      providesTags: ['Unidades'],
    }),
    
    createUnidade: builder.mutation({
      query: (data) => ({
        url: '/unidades',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),
    
    updateUnidade: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unidades/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),
    
    deleteUnidade: builder.mutation({
      query: (id) => ({
        url: `/unidades/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unidades'],
    }),
    
    // Especialidades
    getEspecialidades: builder.query({
      query: () => '/especialidades',
      providesTags: ['Especialidades'],
    }),
    
    // Staging
    getStaging: builder.query({
      query: (params) => ({
        url: '/staging',
        params,
      }),
      providesTags: ['Staging'],
    }),
    
    getStagingById: builder.query({
      query: (id) => `/staging/${id}`,
      providesTags: ['Staging'],
    }),
    
    enrichStaging: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/staging/${id}/enrich`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Staging'],
    }),
    
    validateStaging: builder.mutation({
      query: (id) => ({
        url: `/staging/${id}/validate`,
        method: 'POST',
      }),
      invalidatesTags: ['Staging', 'Unidades'],
    }),
    
    // Users (Superadmin only)
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    
    createUser: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    
    // Audit (Superadmin only)
    getAuditLogs: builder.query({
      query: (params) => ({
        url: '/audit',
        params,
      }),
      providesTags: ['Audit'],
    }),
    
    // ETL (Superadmin only)
    getETLExecutions: builder.query({
      query: (params) => ({
        url: '/etl/executions',
        params,
      }),
      providesTags: ['ETL'],
    }),
    
    getETLStats: builder.query({
      query: () => '/etl/stats',
      providesTags: ['ETL'],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetUnidadesQuery,
  useCreateUnidadeMutation,
  useUpdateUnidadeMutation,
  useDeleteUnidadeMutation,
  useGetEspecialidadesQuery,
  useGetStagingQuery,
  useGetStagingByIdQuery,
  useEnrichStagingMutation,
  useValidateStagingMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetAuditLogsQuery,
  useGetETLExecutionsQuery,
  useGetETLStatsQuery,
} = apiSlice
