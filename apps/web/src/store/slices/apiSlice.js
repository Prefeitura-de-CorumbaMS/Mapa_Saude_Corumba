import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from './authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  // Se receber erro 401 ou mensagem de token inválido, fazer logout
  if (result.error &&
      (result.error.status === 401 ||
       result.error.data?.error?.includes('token') ||
       result.error.data?.error?.includes('Token'))) {
    api.dispatch(logout())
    window.location.href = '/admin/login'
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Unidades', 'Profissionais', 'Especialidades', 'Staging', 'Users', 'Audit', 'Bairros', 'Icones', 'Analytics', 'Vigilancia'],
  keepUnusedDataFor: 300, // Cache por 5 minutos (300 segundos)
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

    getUnidadeMedicos: builder.query({
      query: (id) => `/unidades/${id}/profissionais`,
      keepUnusedDataFor: 300, // Cache por 5 minutos
    }),

    getUnidadeRedesSociais: builder.query({
      query: (id) => `/unidades/${id}/redes-sociais`,
      providesTags: ['Unidades'],
    }),

    createUnidadeRedeSocial: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unidades/${id}/redes-sociais`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    updateUnidadeRedeSocial: builder.mutation({
      query: ({ id, redeId, ...data }) => ({
        url: `/unidades/${id}/redes-sociais/${redeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    deleteUnidadeRedeSocial: builder.mutation({
      query: ({ id, redeId }) => ({
        url: `/unidades/${id}/redes-sociais/${redeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unidades'],
    }),

    getBairros: builder.query({
      query: (params) => ({
        url: '/bairros',
        params,
      }),
      providesTags: ['Bairros'],
    }),

    createBairro: builder.mutation({
      query: (data) => ({
        url: '/bairros',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bairros'],
    }),

    updateBairro: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/bairros/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Bairros'],
    }),

    deleteBairro: builder.mutation({
      query: (id) => ({
        url: `/bairros/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bairros'],
    }),

    getLastUpdate: builder.query({
      query: () => '/unidades/stats/last-update',
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

    // Profissionais de Saúde
    getMedicos: builder.query({
      query: (params) => ({
        url: '/profissionais',
        params,
      }),
      providesTags: ['Profissionais'],
    }),

    createMedico: builder.mutation({
      query: (data) => ({
        url: '/profissionais',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profissionais'],
    }),

    updateMedico: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/profissionais/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profissionais'],
    }),

    deleteMedico: builder.mutation({
      query: (id) => ({
        url: `/profissionais/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Profissionais'],
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

    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
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

    getAuditStats: builder.query({
      query: (params) => ({
        url: '/audit/stats/summary',
        params,
      }),
      providesTags: ['Audit'],
    }),

    // Upload de imagem
    uploadUnidadeImagem: builder.mutation({
      query: (formData) => ({
        url: '/upload/unidade-imagem',
        method: 'POST',
        body: formData,
      }),
    }),

    deleteUnidadeImagem: builder.mutation({
      query: (filename) => ({
        url: `/upload/unidade-imagem/${filename}`,
        method: 'DELETE',
      }),
    }),

    // Upload de ícone
    uploadIcone: builder.mutation({
      query: (formData) => ({
        url: '/upload/icone',
        method: 'POST',
        body: formData,
      }),
    }),

    // Ícones
    getIcones: builder.query({
      query: (params = {}) => ({
        url: '/icones',
        params,
      }),
      providesTags: ['Icones'],
    }),

    getIconeById: builder.query({
      query: (id) => `/icones/${id}`,
      providesTags: ['Icones'],
    }),

    createIcone: builder.mutation({
      query: (data) => ({
        url: '/icones',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    uploadIconeFile: builder.mutation({
      query: (formData) => ({
        url: '/icones/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    updateIcone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/icones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    deleteIcone: builder.mutation({
      query: (id) => ({
        url: `/icones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    reordenarIcones: builder.mutation({
      query: (icones) => ({
        url: '/icones/reordenar/batch',
        method: 'PUT',
        body: { icones },
      }),
      invalidatesTags: ['Icones'],
    }),

    // Analytics
    getAnalyticsStats: builder.query({
      query: () => '/analytics/stats',
      providesTags: ['Analytics'],
    }),

    // Vigilância em Saúde - Dengue
    getDengueBySE: builder.query({
      query: ({ ano, se }) => `/vigilancia/dengue/se?ano=${ano}&se=${se}`,
      providesTags: ['Vigilancia'],
      keepUnusedDataFor: 600, // Cache 10 minutos
    }),

    // Buscar todos os dados de um ano (para gerenciamento)
    getDengueByAno: builder.query({
      query: ({ ano }) => `/vigilancia/dengue/ano?ano=${ano}`,
      providesTags: ['Vigilancia'],
      keepUnusedDataFor: 300, // Cache 5 minutos
    }),

    getDengueSerie: builder.query({
      query: ({ ano, se_inicio, se_fim }) =>
        `/vigilancia/dengue/serie?ano=${ano}&se_inicio=${se_inicio}&se_fim=${se_fim}`,
      providesTags: ['Vigilancia'],
      keepUnusedDataFor: 600,
    }),

    getDenguePerfil: builder.query({
      query: ({ ano, se }) => `/vigilancia/dengue/perfil?ano=${ano}&se=${se}`,
      providesTags: ['Vigilancia'],
      keepUnusedDataFor: 600,
    }),

    getDengueBairros: builder.query({
      query: ({ ano, se, tipo }) =>
        `/vigilancia/dengue/bairros?ano=${ano}&se=${se}&tipo=${tipo}`,
      providesTags: ['Vigilancia'],
      keepUnusedDataFor: 600,
    }),

    // Vigilância - Importação (Admin)
    importarVigilancia: builder.mutation({
      query: (data) => ({
        url: '/vigilancia/dengue/importar',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Atualizar registro de bairro
    updateDengueBairro: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/vigilancia/dengue/bairro/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Deletar registro de bairro
    deleteDengueBairro: builder.mutation({
      query: ({ id }) => ({
        url: `/vigilancia/dengue/bairro/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Atualizar registro de SE
    updateDengueSE: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/vigilancia/dengue/se/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Deletar registro de SE
    deleteDengueSE: builder.mutation({
      query: ({ id }) => ({
        url: `/vigilancia/dengue/se/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Atualizar caso individual
    updateDengueCaso: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/vigilancia/dengue/caso/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Vigilancia'],
    }),

    // Vigilância - Deletar caso individual
    deleteDengueCaso: builder.mutation({
      query: ({ id }) => ({
        url: `/vigilancia/dengue/caso/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vigilancia'],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetUnidadesQuery,
  useGetUnidadeMedicosQuery,
  useGetUnidadeRedesSociaisQuery,
  useCreateUnidadeRedeSocialMutation,
  useUpdateUnidadeRedeSocialMutation,
  useDeleteUnidadeRedeSocialMutation,
  useGetBairrosQuery,
  useCreateBairroMutation,
  useUpdateBairroMutation,
  useDeleteBairroMutation,
  useCreateUnidadeMutation,
  useUpdateUnidadeMutation,
  useDeleteUnidadeMutation,
  useGetMedicosQuery,
  useCreateMedicoMutation,
  useUpdateMedicoMutation,
  useDeleteMedicoMutation,
  useGetEspecialidadesQuery,
  useGetStagingQuery,
  useGetStagingByIdQuery,
  useEnrichStagingMutation,
  useValidateStagingMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery,
  useGetAuditStatsQuery,
  useGetLastUpdateQuery,
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
  useUploadIconeMutation,
  useGetIconesQuery,
  useGetIconeByIdQuery,
  useCreateIconeMutation,
  useUploadIconeFileMutation,
  useUpdateIconeMutation,
  useDeleteIconeMutation,
  useReordenarIconesMutation,
  useGetAnalyticsStatsQuery,
  useGetDengueBySEQuery,
  useGetDengueByAnoQuery,
  useGetDengueSerieQuery,
  useGetDenguePerfilQuery,
  useGetDengueBairrosQuery,
  useImportarVigilanciaMutation,
  useUpdateDengueBairroMutation,
  useDeleteDengueBairroMutation,
  useUpdateDengueSEMutation,
  useDeleteDengueSEMutation,
  useUpdateDengueCasoMutation,
  useDeleteDengueCasoMutation,
} = apiSlice
