import * as supabaseApi from '../services/supabaseApi';
import { OrderStatus } from '../types';

interface RequestConfig {
  params?: Record<string, string | undefined>;
}

function ok<T>(data: T) {
  return { data };
}

/**
 * Supabase-backed API router preserving the client interface across pages.
 * Every call executes directly against the Supabase project via @supabase/supabase-js.
 */
export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(path: string, config?: RequestConfig): Promise<{ data: T }> {
    const params = config?.params || {};

    if (path === '/salads') {
      const salads = await supabaseApi.fetchSalads(
        params.includeUnavailable === 'true'
      );
      return ok({ salads } as unknown as T);
    }

    if (path === '/plans') {
      const plans = await supabaseApi.fetchPlans();
      return ok({ plans } as unknown as T);
    }

    if (path === '/ingredients') {
      const ingredients = await supabaseApi.fetchIngredients(
        params.includeUnavailable === 'true'
      );
      return ok({ ingredients } as unknown as T);
    }

    if (path === '/custom-salads') {
      const customSalads = await supabaseApi.fetchMyCustomSalads();
      return ok({ customSalads } as unknown as T);
    }

    if (path === '/orders/my') {
      const orders = await supabaseApi.fetchMyOrders();
      return ok({ orders } as unknown as T);
    }

    if (path === '/orders') {
      const orders = await supabaseApi.fetchAllOrders({
        status: params.status,
        orderType: params.orderType,
        search: params.search,
      });
      return ok({ orders } as unknown as T);
    }

    if (path === '/subscriptions/my') {
      const subscriptions = await supabaseApi.fetchMySubscriptions();
      return ok({ subscriptions } as unknown as T);
    }

    if (path === '/subscriptions') {
      const subscriptions = await supabaseApi.fetchAllSubscriptions();
      return ok({ subscriptions } as unknown as T);
    }

    if (path === '/members/overview') {
      const overview = await supabaseApi.fetchAdminOverview();
      return ok(overview as unknown as T);
    }

    if (path === '/members') {
      const members = await supabaseApi.fetchMembers({
        search: params.search,
        status: params.status,
        plan: params.plan,
      });
      return ok({ members } as unknown as T);
    }

    throw new Error(`Unsupported GET route: ${path}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T = any>(path: string, payload?: any): Promise<{ data: T }> {
    if (path === '/orders') {
      const order = await supabaseApi.placeCodOrder(payload);
      return ok({ order } as unknown as T);
    }

    if (path === '/payments/subscribe-cod') {
      const subscription = await supabaseApi.subscribeCod(payload);
      return ok({ subscription } as unknown as T);
    }

    if (path === '/custom-salads') {
      const customSalad = await supabaseApi.createCustomSalad(payload);
      return ok({ customSalad } as unknown as T);
    }

    if (path === '/salads') {
      const salad = await supabaseApi.createSalad(payload);
      return ok({ salad } as unknown as T);
    }

    if (path === '/ingredients') {
      const ingredient = await supabaseApi.createIngredient(payload);
      return ok({ ingredient } as unknown as T);
    }

    if (path === '/members') {
      const member = await supabaseApi.createMemberByAdmin(payload);
      return ok({ member } as unknown as T);
    }

    throw new Error(`Unsupported POST route: ${path}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async put<T = any>(path: string, payload?: any): Promise<{ data: T }> {
    if (path.startsWith('/salads/')) {
      const id = path.replace('/salads/', '');
      const salad = await supabaseApi.updateSalad(id, payload);
      return ok({ salad } as unknown as T);
    }

    if (path.startsWith('/ingredients/')) {
      const id = path.replace('/ingredients/', '');
      const ingredient = await supabaseApi.updateIngredient(id, payload);
      return ok({ ingredient } as unknown as T);
    }

    throw new Error(`Unsupported PUT route: ${path}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patch<T = any>(path: string, payload?: any): Promise<{ data: T }> {
    const subMatch = path.match(/^\/subscriptions\/([^/]+)\/(pause|resume|cancel)$/);
    if (subMatch) {
      const [, id, action] = subMatch;
      if (action === 'pause') {
        const subscription = await supabaseApi.pauseSubscription(id);
        return ok({ subscription } as unknown as T);
      }
      if (action === 'resume') {
        const subscription = await supabaseApi.resumeSubscription(id);
        return ok({ subscription } as unknown as T);
      }
      const subscription = await supabaseApi.cancelSubscription(id);
      return ok({ subscription } as unknown as T);
    }

    const orderStatusMatch = path.match(/^\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch) {
      const [, id] = orderStatusMatch;
      const order = await supabaseApi.updateOrderStatus(
        id,
        payload?.status as OrderStatus
      );
      return ok({ order } as unknown as T);
    }

    const reactivateMatch = path.match(/^\/members\/([^/]+)\/reactivate$/);
    if (reactivateMatch) {
      await supabaseApi.reactivateMember(reactivateMatch[1]);
      return ok({ message: 'Member reactivated.' } as unknown as T);
    }

    throw new Error(`Unsupported PATCH route: ${path}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete<T = any>(path: string): Promise<{ data: T }> {
    if (path.startsWith('/custom-salads/')) {
      await supabaseApi.deleteCustomSalad(path.replace('/custom-salads/', ''));
      return ok({ message: 'Deleted' } as unknown as T);
    }

    if (path.startsWith('/salads/')) {
      await supabaseApi.deleteSalad(path.replace('/salads/', ''));
      return ok({ message: 'Deleted' } as unknown as T);
    }

    if (path.startsWith('/ingredients/')) {
      await supabaseApi.deleteIngredient(path.replace('/ingredients/', ''));
      return ok({ message: 'Deleted' } as unknown as T);
    }

    if (path.startsWith('/members/')) {
      await supabaseApi.deactivateMember(path.replace('/members/', ''));
      return ok({ message: 'Member deactivated.' } as unknown as T);
    }

    throw new Error(`Unsupported DELETE route: ${path}`);
  },
};
