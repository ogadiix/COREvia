// Banking API Client for COREvia PostgreSQL Backend

const API_BASE = '/api';

export interface ApiResponseError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: any;
  };
}

// In-memory / session storage token holder for multi-environment cookie & bearer support
let activeSessionToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    activeSessionToken = sessionStorage.getItem('corevia_session_token');
  } catch (e) {
    console.warn('sessionStorage is not available');
  }
}

export function setSessionToken(token: string | null) {
  activeSessionToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem('corevia_session_token', token);
      } else {
        sessionStorage.removeItem('corevia_session_token');
      }
    } catch (e) {
      console.warn('sessionStorage is not available');
    }
  }
}

export function getSessionToken(): string | null {
  return activeSessionToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject X-Requested-With for CSRF verification across iframe/CORS boundaries
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }

  // Inject session bearer authorization if present (supports cookie + header dual mode)
  if (activeSessionToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${activeSessionToken}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Ensures HTTP-only cookies are sent across iframe / origin
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error(`[API] Failed to parse JSON for ${endpoint}. Status: ${response.status}. Body:`, text.substring(0, 200));
    
    // Convert HTML 502/503 (Cloud Run/Nginx) or other non-JSON errors to standard format
    const errorCode = response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'API_ERROR';
    let errorMsg = 'Received an invalid response from the banking service.';
    if (response.status >= 500) {
      errorMsg = 'The banking service is temporarily unavailable or starting up. Please try again.';
    } else if (response.status === 403) {
      errorMsg = 'Access forbidden. Please verify your session credentials and reload.';
    }
      
    const err = new Error(errorMsg) as any;
    err.code = errorCode;
    err.status = response.status;
    throw err;
  }
  
  if (!response.ok) {
    const err = data as ApiResponseError;
    const errorObj = new Error(err.error?.message || `Banking API error (${response.status})`) as any;
    errorObj.code = err.error?.code || 'API_ERROR';
    errorObj.status = response.status;
    throw errorObj;
  }
  
  return data as T;
}

export const bankingApi = {
  // Authentication
  async login(credentials: { email: string; password: string }) {
    const res = await request<{ status: string; sessionToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.sessionToken) {
      setSessionToken(res.sessionToken);
    }
    return res;
  },

  async getMe() {
    return await request<{ user: any }>('/auth/me');
  },

  async logout(reason?: string) {
    try {
      await request<{ status: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'MANUAL_USER_LOGOUT' }),
      });
    } finally {
      setSessionToken(null);
    }
  },

  async heartbeat() {
    return await request<{ status: string; timestamp: string; user: any }>('/auth/heartbeat', {
      method: 'POST',
    });
  },

  async getDevCredentials() {
    return await request<{ syntheticTestPassword: string; accounts: any[] }>('/auth/dev-credentials');
  },

  // Customers
  async getCustomers(params: { search?: string; riskCategory?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.riskCategory) query.set('riskCategory', params.riskCategory);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/customers${qs}`);
  },

  async getCustomerById(id: string | number) {
    return await request<any>(`/customers/${id}`);
  },

  async getCustomer360(id: string | number) {
    return await request<any>(`/customers/${id}/360`);
  },

  async getCustomerAccounts(id: string | number) {
    return await request<any[]>(`/customers/${id}/accounts`);
  },

  async getCustomerLoans(id: string | number) {
    return await request<any[]>(`/customers/${id}/loans`);
  },

  async getCustomerInteractions(id: string | number) {
    return await request<any[]>(`/customers/${id}/interactions`);
  },

  async getCustomerCases(id: string | number) {
    return await request<any[]>(`/customers/${id}/cases`);
  },

  async getCustomerOpportunities(id: string | number) {
    return await request<any[]>(`/customers/${id}/opportunities`);
  },

  async getCustomerScore(id: string | number) {
    return await request<any>(`/customers/${id}/score`);
  },

  async getCustomerInsights(id: string | number) {
    return await request<any[]>(`/customers/${id}/insights`);
  },

  // Tasks
  async getTasks(params: { customerId?: number; status?: string; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<any[]>(`/tasks${qs}`);
  },

  async createTask(data: {
    customerId: number;
    title: string;
    description?: string;
    dueDate: string;
    priority?: string;
    status?: string;
    assignedToId?: number;
  }) {
    return await request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: number, data: { status?: string; priority?: string; dueDate?: string; description?: string }) {
    return await request<any>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async createFollowup(data: {
    customerId: number;
    title: string;
    dueDate: string;
    notes?: string;
    channel?: string;
  }) {
    return await request<any>('/followups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Interactions
  async getInteractions(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<any>(`/interactions${qs}`);
  },

  async getInteractionMetrics(customerId?: number) {
    const qs = customerId ? `?customerId=${customerId}` : '';
    return await request<any>(`/interactions/metrics${qs}`);
  },

  async getCustomerCommunicationProfile(customerId: number) {
    return await request<any>(`/customers/${customerId}/communication-profile`);
  },

  async recordInteraction(data: {
    customerId: number;
    channel: string;
    interactionType: string;
    subject: string;
    summary: string;
    outcome?: string;
    sentiment?: string;
    duration?: number;
    timestamp?: string;
    followupRequired?: boolean;
    followupAction?: string | null;
    followupDate?: string | null;
    followupPriority?: string | null;
    participants?: any[];
    commitments?: any[];
    linkedOpportunityId?: number | null;
    linkedCaseId?: number | null;
    agentId?: number;
  }) {
    return await request<any>('/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Opportunities
  async getOpportunities(params: { customerId?: number; stage?: string; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.stage) query.set('stage', params.stage);
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<any[]>(`/opportunities${qs}`);
  },

  async getOpportunityById(id: number) {
    return await request<any>(`/opportunities/${id}`);
  },

  async createOpportunity(data: {
    customerId: number;
    title: string;
    stage?: string;
    expectedValue?: string;
    probability?: number;
    expectedCloseDate?: string;
    notes?: string;
  }) {
    return await request<any>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOpportunity(id: number, data: { stage?: string; probability?: number; notes?: string; expectedValue?: string }) {
    return await request<any>(`/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Cases
  async getCases(params: { customerId?: number; status?: string; priority?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/cases${qs}`);
  },

  async getCaseById(id: number) {
    return await request<any>(`/cases/${id}`);
  },

  async updateCase(id: number, data: { status?: string; priority?: string; resolutionSummary?: string }) {
    return await request<any>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async addCaseComment(id: number, comment: string) {
    return await request<any>(`/cases/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  // Audit Logs
  async getAuditLogs(limit: number = 25) {
    return await request<any[]>(`/audit-logs?limit=${limit}`);
  },

  // Accounts
  async getAccounts(params: {
    search?: string;
    accountType?: string;
    status?: string;
    branchCode?: string;
    customerId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.accountType) query.set('accountType', params.accountType);
    if (params.status) query.set('status', params.status);
    if (params.branchCode) query.set('branchCode', params.branchCode);
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/accounts${qs}`);
  },

  async getAccountStats() {
    return await request<any>('/accounts/stats');
  },

  async getAccountDetail(idOrNumber: string | number) {
    return await request<any>(`/accounts/${idOrNumber}`);
  },

  async getAccountTransactions(
    idOrNumber: string | number,
    params: { page?: number; limit?: number; type?: string; status?: string } = {}
  ) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/accounts/${idOrNumber}/transactions${qs}`);
  },

  // Loans
  async getLoans(params: {
    search?: string;
    loanType?: string;
    assetClassification?: string;
    customerId?: number;
    rmId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.loanType) query.set('loanType', params.loanType);
    if (params.assetClassification) query.set('assetClassification', params.assetClassification);
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.rmId) query.set('rmId', String(params.rmId));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/loans${qs}`);
  },

  async getLoanStats() {
    return await request<any>('/loans/stats');
  },

  async getLoanDetail(idOrNumber: string | number) {
    return await request<any>(`/loans/${idOrNumber}`);
  },

  async getLoanRepayments(
    idOrNumber: string | number,
    params: { page?: number; limit?: number } = {}
  ) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; summary: any; pagination: any }>(`/loans/${idOrNumber}/repayments${qs}`);
  },

  // Products
  async getProducts(params: { search?: string; category?: string; isActive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<any[]>(`/products${qs}`);
  },

  async getProductById(idOrCode: string | number) {
    return await request<any>(`/products/${idOrCode}`);
  },

  async getCustomerProducts(customerIdOrCode: string | number) {
    return await request<any[]>(`/customers/${customerIdOrCode}/products`);
  },

  async enrollCustomerProduct(customerIdOrCode: string | number, productId: number, accountId?: number) {
    return await request<any>(`/customers/${customerIdOrCode}/products`, {
      method: 'POST',
      body: JSON.stringify({ productId, accountId }),
    });
  },

  // Financial Relationship & Dynamic Intelligence
  async getCustomerFinancialSummary(customerIdOrCode: string | number) {
    return await request<any>(`/customers/${customerIdOrCode}/financial-summary`);
  },

  async recalculateCoreScore(customerIdOrCode: string | number) {
    return await request<any>(`/customers/${customerIdOrCode}/recalculate-core-score`, {
      method: 'POST',
    });
  },

  // Relationship Intelligence Engine (Phase 10)
  async getIntelligence(params: {
    customerId?: number;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    assignedRm?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.category) query.set('category', params.category);
    if (params.priority) query.set('priority', params.priority);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.assignedRm) query.set('assignedRm', params.assignedRm);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/intelligence${qs}`);
  },

  async getIntelligenceSummary() {
    return await request<any>('/intelligence/summary');
  },

  async getIntelligenceById(id: number) {
    return await request<any>(`/intelligence/${id}`);
  },

  async acknowledgeIntelligence(id: number, note?: string) {
    return await request<any>(`/intelligence/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async resolveIntelligence(id: number, note?: string) {
    return await request<any>(`/intelligence/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async recalculateAllIntelligence() {
    return await request<any>('/intelligence/recalculate-all', {
      method: 'POST',
    });
  },

  async getCustomerIntelligence(customerIdOrCode: string | number) {
    return await request<any[]>(`/customers/${customerIdOrCode}/intelligence`);
  },

  async recalculateCustomerIntelligence(customerIdOrCode: string | number) {
    return await request<any>(`/customers/${customerIdOrCode}/intelligence/recalculate`, {
      method: 'POST',
    });
  },

  // Next Best Action Engine (Phase 11)
  async getCustomerNextBestActions(customerIdOrCode: string | number) {
    return await request<any[]>(`/customers/${customerIdOrCode}/next-best-actions`);
  },

  async recalculateCustomerNextBestActions(customerIdOrCode: string | number) {
    return await request<any>(`/customers/${customerIdOrCode}/next-best-actions/recalculate`, {
      method: 'POST',
    });
  },

  async getNextBestActions(params: {
    customerId?: number;
    assignedRmId?: number;
    actionType?: string;
    priority?: string;
    urgency?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.assignedRmId) query.set('assignedRmId', String(params.assignedRmId));
    if (params.actionType) query.set('actionType', params.actionType);
    if (params.priority) query.set('priority', params.priority);
    if (params.urgency) query.set('urgency', params.urgency);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{ data: any[]; pagination: any }>(`/next-best-actions${qs}`);
  },

  async getDailyRelationshipBrief() {
    return await request<any>('/next-best-actions/brief');
  },

  async getNextBestActionById(id: number) {
    return await request<any>(`/next-best-actions/${id}`);
  },

  async acceptNextBestAction(id: number) {
    return await request<any>(`/next-best-actions/${id}/accept`, {
      method: 'POST',
    });
  },

  async dismissNextBestAction(id: number, reason: string) {
    return await request<any>(`/next-best-actions/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async createTaskFromNextBestAction(
    id: number,
    taskData?: { title?: string; dueDate?: string; priority?: string; description?: string }
  ) {
    return await request<any>(`/next-best-actions/${id}/create-task`, {
      method: 'POST',
      body: JSON.stringify(taskData || {}),
    });
  },

  async recalculateAllNextBestActions() {
    return await request<any>('/next-best-actions/recalculate-all', {
      method: 'POST',
    });
  },

  // ----------------------------------------------------
  // Phase 12: Customer Opportunity Radar APIs
  // ----------------------------------------------------
  async getOpportunityRadar(params: {
    customerId?: number;
    assignedRmId?: number;
    category?: string;
    priority?: string;
    status?: string;
    signalType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.assignedRmId) query.set('assignedRmId', String(params.assignedRmId));
    if (params.category) query.set('category', params.category);
    if (params.priority) query.set('priority', params.priority);
    if (params.status) query.set('status', params.status);
    if (params.signalType) query.set('signalType', params.signalType);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request<{
      signals: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/opportunity-radar${qs}`);
  },

  async getOpportunityRadarStats(assignedRmId?: number) {
    const qs = assignedRmId ? `?assignedRmId=${assignedRmId}` : '';
    return await request<any>(`/opportunity-radar/stats${qs}`);
  },

  async getOpportunityRadarById(id: number) {
    return await request<any>(`/opportunity-radar/${id}`);
  },

  async recalculateCustomerRadar(cif: string) {
    return await request<any>(`/opportunity-radar/customer/${encodeURIComponent(cif)}/recalculate`, {
      method: 'POST',
    });
  },

  async recalculateAllRadar() {
    return await request<any>('/opportunity-radar/recalculate-all', {
      method: 'POST',
    });
  },

  async reviewRadarSignal(id: number) {
    return await request<any>(`/opportunity-radar/${id}/review`, {
      method: 'POST',
    });
  },

  async convertRadarToOpportunity(
    id: number,
    opportunityInput: {
      title?: string;
      stage?: string;
      expectedValue?: string;
      probability?: number;
      expectedCloseDate?: string;
      notes?: string;
    }
  ) {
    return await request<any>(`/opportunity-radar/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(opportunityInput),
    });
  },

  async dismissRadarSignal(id: number, reason: string) {
    return await request<any>(`/opportunity-radar/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Global Search
  async searchAll(query: string) {
    if (!query.trim()) return { customers: [], accounts: [], loans: [], products: [] };
    return await request<{ customers: any[]; accounts: any[]; loans: any[]; products: any[] }>(
      `/search?q=${encodeURIComponent(query.trim())}`
    );
  },

  // System & Health Status
  async getSystemStatus() {
    return await request<{
      status: string;
      timestamp: string;
      service?: string;
      environment?: string;
      geminiEngine?: string;
      database?: { status: string; dialect: string };
    }>('/system/status');
  },

  // Phase 15: Notifications & Intelligent Alerts
  async getNotifications(params: {
    status?: string;
    category?: string;
    severity?: string;
    notificationType?: string;
    customerId?: number;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.severity) query.set('severity', params.severity);
    if (params.notificationType) query.set('notificationType', params.notificationType);
    if (params.customerId) query.set('customerId', String(params.customerId));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return await request<{ data: any[]; total: number; page: number; limit: number }>(
      `/notifications${qs ? `?${qs}` : ''}`
    );
  },

  async getUnreadNotificationCount() {
    return await request<{ unreadCount: number }>('/notifications/unread-count');
  },

  async getNotificationSummary() {
    return await request<any>('/notifications/summary');
  },

  async markNotificationRead(id: number) {
    return await request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllNotificationsRead() {
    return await request<{ success: boolean; count: number; message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  async acknowledgeNotification(id: number) {
    return await request<{ success: boolean; message: string }>(`/notifications/${id}/acknowledge`, {
      method: 'POST',
    });
  },

  async dismissNotification(id: number) {
    return await request<{ success: boolean; message: string }>(`/notifications/${id}/dismiss`, {
      method: 'POST',
    });
  },

  async getNotificationPreferences() {
    return await request<any>('/notifications/preferences');
  },

  async updateNotificationPreferences(prefs: any) {
    return await request<any>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  },

  async syncNotifications() {
    return await request<{ success: boolean; summary: any; message: string }>('/notifications/sync', {
      method: 'POST',
    });
  },

  // =========================================================================
  // PHASE 16: ADVANCED ANALYTICS & MANAGEMENT INTELLIGENCE
  // =========================================================================
  async getAnalyticsOverview(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/overview?${q.toString()}`);
  },

  async getRelationshipPortfolio(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/portfolio?${q.toString()}`);
  },

  async getCustomerHealth(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/health?${q.toString()}`);
  },

  async getCoreScoreTrends(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/core-score-trends?${q.toString()}`);
  },

  async getOpportunityAnalytics(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/opportunities?${q.toString()}`);
  },

  async getServicePerformance(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/service-performance?${q.toString()}`);
  },

  async getRmProductivity(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/rm-productivity?${q.toString()}`);
  },

  async getProductPenetration(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/product-penetration?${q.toString()}`);
  },

  async getEngagementAnalytics(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/engagement?${q.toString()}`);
  },

  async getTaskAnalytics(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/tasks?${q.toString()}`);
  },

  async getIntelligenceAnalytics(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/intelligence?${q.toString()}`);
  },

  async getWhatChanged(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<any>(`/analytics/what-changed?${q.toString()}`);
  },

  async downloadAnalyticsCsv(type: string, params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    q.append('type', type);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    
    const headers = new Headers();
    if (activeSessionToken) {
      headers.set('Authorization', `Bearer ${activeSessionToken}`);
    }

    const response = await fetch(`${API_BASE}/analytics/export?${q.toString()}`, {
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export analytics (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = `COREvia_${type}_Export.csv`;
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return filename;
  },

  // ====================================================
  // PHASE 22: ONBOARDING & KYC WORKSPACE CLIENT API
  // ====================================================
  async listOnboardingApplications(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    return await request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(
      `/onboarding/applications?${q.toString()}`
    );
  },

  async getOnboardingApplication(idOrNumber: string | number) {
    return await request<any>(`/onboarding/applications/${idOrNumber}`);
  },

  async getCustomerOnboarding(customerId: number) {
    return await request<{ activeApplication: any | null; history: any[]; completedCount: number }>(
      `/onboarding/customer/${customerId}`
    );
  },

  async createOnboardingApplication(data: any) {
    return await request<any>('/onboarding/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOnboardingStatus(id: number, status: string, reason?: string) {
    return await request<any>(`/onboarding/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  async updateKycReview(id: number, data: any) {
    return await request<any>(`/onboarding/applications/${id}/kyc`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateKybReview(id: number, data: any) {
    return await request<any>(`/onboarding/applications/${id}/kyb`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async uploadOnboardingDocument(id: number, data: any) {
    return await request<any>(`/onboarding/applications/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewOnboardingDocument(docId: number, data: any) {
    return await request<any>(`/onboarding/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async raiseOnboardingException(id: number, data: any) {
    return await request<any>(`/onboarding/applications/${id}/exceptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resolveOnboardingException(excId: number, resolution: string) {
    return await request<any>(`/onboarding/exceptions/${excId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    });
  },

  async waiveOnboardingException(excId: number, waiveReason: string) {
    return await request<any>(`/onboarding/exceptions/${excId}/waive`, {
      method: 'PATCH',
      body: JSON.stringify({ waiveReason }),
    });
  },

  async reassignOnboardingApplication(id: number, data: any) {
    return await request<any>(`/onboarding/applications/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOnboardingMetrics() {
    return await request<any>('/onboarding/metrics');
  },

  // --------------------------------------------------
  // Phase 25: Banking Document Intelligence
  // --------------------------------------------------
  async getDocuments(params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    const queryStr = searchParams.toString();
    return await request<any>(`/documents${queryStr ? `?${queryStr}` : ''}`);
  },

  async getDocumentMetrics(customerId?: number) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return await request<any>(`/documents/metrics${q}`);
  },

  async getDocumentIntelligence(customerId?: number) {
    const q = customerId ? `?customerId=${customerId}` : '';
    return await request<any>(`/documents/intelligence${q}`);
  },

  async getCustomerDocumentRequirements(customerId: number) {
    return await request<any>(`/documents/requirements?customerId=${customerId}`);
  },

  async getDocumentById(id: number) {
    return await request<any>(`/documents/${id}`);
  },

  async uploadDocument(data: any) {
    return await request<any>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replaceDocument(id: number, data: any) {
    return await request<any>(`/documents/${id}/replace`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyDocument(id: number, comments?: string) {
    return await request<any>(`/documents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  async rejectDocument(id: number, data: { reason: string; createTask?: boolean }) {
    return await request<any>(`/documents/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async requestDocumentReplacement(id: number, data: { reason: string; requestedDocType?: string; dueDate?: string }) {
    return await request<any>(`/documents/${id}/request-replacement`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async triggerDocumentExtraction(id: number) {
    return await request<any>(`/documents/${id}/extract`, {
      method: 'POST',
    });
  },

  async verifyDocumentExtraction(extractionId: number, status: 'HUMAN_VERIFIED' | 'REJECTED') {
    return await request<any>(`/documents/extractions/${extractionId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};
