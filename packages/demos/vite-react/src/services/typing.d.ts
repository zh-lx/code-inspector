declare namespace API {
  interface List<D> {
    List: D;
    VirtualCount: number;
  }

  type RuleItem = {
    key: number;
    disabled?: boolean;
    href: string;
    avatar: string;
    name: string;
    owner: string;
    desc: string;
    callNo: number;
    status: string;
    updatedAt: Date;
    createdAt: Date;
    progress: number;
  };

  interface Article {
    id?: string;
    owner?: string;
    title?: string;
    avatar?: string;
    cover?: string;
    status?: string;
    percent?: string;
    logo?: string;
    href?: string;
    updatedAt?: number;
    createdAt?: number;
    subDescription?: string;
    description?: string;
    activeUser?: string;
    newUser?: string;
    star?: string;
    like?: string;
    message?: string;
    content?: string;
    members?: Array<{
      avatar: string;
      name: string;
      id: string;
    }>;
  }
  type ArticleList = Article[];

  type AnalysisChartData = {
    visitData?: any[];
    visitData2?: any[];
    salesData?: any[];
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    clickClose?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  interface UserInfo {
    Name?: string;
    Email?: string;
    Phone?: string;
    Address?: string;
  }

  interface LoginData {
    SessionKey: string;
    UserInfo: UserInfo;
    MenuItems: object[];
  }

  interface LoginParams {
    username: string;
    password: string;
  }
}
