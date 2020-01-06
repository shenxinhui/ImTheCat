import Router from 'vue-router';
import config from './config.json';

let vRouter: Router;
let ALL_WHITELIST: string[] = [];

// Build route views.
// 构建路由视图。
const buildRouteView = (view?: any) => {
  // If the routing object name in the configuration information is empty,
  // the empty object is returned.
  // 配置信息中路由对象名为空，则返回空对象
  if (!view.name) { return {}; }

  // Router the component accept parameter type is Function and not Object.
  // What is returned is the import information of the view component, which returns a promise object.
  // 返回的是视图组件的导入信息，它返回一个Promise对象。
  const viewPath = view.filePath ? view.filePath : `views/${view.name}`;
  
  return () => import(`@/${viewPath}${!view.filePath ? '/index' : ''}.vue`)
    .then(data => {
      return data;
    })
    .catch(err => {
      // Cannot find module or folder.
      // 找不到模块或文件夹，则将其加入丢失模块列表。
      console.error(`[Build Router View]: Cannot find module or folder, Please check 'views/${view.name}'.`);
      vRouter.push({ name: '404' });
      return {};
    });
};

// Build routing object information from a configuration file.
// 通过配置文件构建路由对象信息。多个路由配置信息会执行多次。
const buildRouteList = () => {  
  const routePreset = config.routePreset;
  const routeList = config.routeList;

  const routeRules: any[] = [];

  // Build the basic properties of the routing object.
  const buildRoutingObject = (item: any, index?: number) => {
    // Processing routing path string.
    const tempPath = item.path
      ? item.path.toString().substring(0, 1) === '/'
        ? `${item.path}` : `/${item.path}`
      : `/${item.name}`;

    if (item.children) {
      buildRoutingObject(item.children);
    } else {
      // return route object
      return Object.assign({}, item, {
        // 路由路径
        path: tempPath,
        // 路由名称
        name: `${item.name ? item.name : 'route' + index}`,
        // 需载入组件
        component: item.name ? buildRouteView(item) : {},
      });
    }
  };

  // 将配置中预设的路由信息加入路由列表
  routePreset.forEach((item: any, index: number) => {
    if (item.name) {
      routeRules.push(buildRoutingObject(item, index));
    }
  });

  // 将配置中的路由信息加入路由列表
  routeList.forEach((item: any, index: number) => {
    if (item.name) {
      routeRules.push(buildRoutingObject(item, index));
    }
  });

  // If you need to use advanced routing behavior, use push to add your routing.

  return routeRules;
};

// Check route whitelist.
// 检查路由白名单。
const routeWhiteList = (to: any) => {
  const tempNameList = ['index', 'home'];
  if (!to.path) { return false; }
  if (to.path === '/' && to.name &&  tempNameList.indexOf(to.name) === -1) { return false; }
  if (ALL_WHITELIST.indexOf(to.path) === -1) { return false; }
  return true;
};

// Router navigation guards.
// 路由导航守卫规则。
const handleRoute = (router: Router) => {
  router.beforeEach((to, from, next) => {
    // If the access to.path is on the whitelist.
    if (!routeWhiteList(to)) {
      next('/404');
      return;
    }
    console.log('%c路由导航守卫规则: %cbeforeEach', 'color:#42b983;', 'font-weight:bolder;');
    console.log('before to', to);
    console.log('before from', from);
    // console.log('before next', typeof next);
    console.log('%c----------', 'color:#42b983;');
    next();
  });

  router.beforeResolve((to, from, next) => {
    console.log('%c路由导航守卫规则: %cbeforeResolve', 'color:#42b983;', 'font-weight:bolder;');
    console.log('resolve to', to);
    console.log('resolve from', from);
    // console.log('resolve next', next);
    console.log('%c----------', 'color:#42b983;');
    next();
  });

  router.afterEach((to, from) => {
    console.log('%c路由导航守卫规则: %cafterEach', 'color:#42b983;', 'font-weight:bolder;');
    console.log('after to', to);
    // console.log('after from', from);
    console.log('%c----------', 'color:#42b983;');
  });
};

// init route information and rules.
// 初始化路由信息以及规则。
export function initRouterRules (base?: '/') {
  // init route whitelist.
  // 初始化路由白名单。
  const whitelistLen = config.whitelist.length + config.other.length;
  if (ALL_WHITELIST.length < whitelistLen) {
    // The base router white list.
    // The other whitelist rules.
    // 将路由白名单以及其他路由信息合并。
    ALL_WHITELIST = config.whitelist.concat(config.other);
  }

  console.log(buildRouteList());

  vRouter = new Router({
    mode: config.mode,
    base: base || process.env.BASE_URL,
    routes: buildRouteList(),
  });

  // 导航守卫
  handleRoute(vRouter);

  return vRouter;
}
