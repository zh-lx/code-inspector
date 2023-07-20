import type { CSSProperties } from 'react';
import HomeOutlined from '@ant-design/icons/HomeOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import BlockOutlined from '@ant-design/icons/BlockOutlined';
import LinkOutlined from '@ant-design/icons/LinkOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import FormOutlined from '@ant-design/icons/FormOutlined';
import TableOutlined from '@ant-design/icons/TableOutlined';
import ProfileOutlined from '@ant-design/icons/ProfileOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DingdingOutlined from '@ant-design/icons/DingdingOutlined';
import GithubOutlined from '@ant-design/icons/GithubOutlined';
import FullscreenOutlined from '@ant-design/icons/FullscreenOutlined';
import FullscreenExitOutlined from '@ant-design/icons/FullscreenExitOutlined';
import MenuUnfoldOutlined from '@ant-design/icons/MenuUnfoldOutlined';
import MenuFoldOutlined from '@ant-design/icons/MenuFoldOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import IdcardOutlined from '@ant-design/icons/IdcardOutlined';
import PoweroffOutlined from '@ant-design/icons/PoweroffOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import BellOutlined from '@ant-design/icons/BellOutlined';
import CaretUpOutlined from '@ant-design/icons/CaretUpOutlined';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import StarOutlined from '@ant-design/icons/StarOutlined';
import LikeOutlined from '@ant-design/icons/LikeOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import AlipayCircleFilled from '@ant-design/icons/AlipayCircleFilled';
import TaobaoCircleOutlined from '@ant-design/icons/TaobaoCircleOutlined';
import WeiboCircleOutlined from '@ant-design/icons/WeiboCircleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

Icon.HomeOutlined = HomeOutlined;
Icon.SettingOutlined = SettingOutlined;
Icon.UnorderedListOutlined = UnorderedListOutlined;
Icon.UserOutlined = UserOutlined;
Icon.BlockOutlined = BlockOutlined;
Icon.LinkOutlined = LinkOutlined;
Icon.LockOutlined = LockOutlined;
Icon.DashboardOutlined = DashboardOutlined;
Icon.FormOutlined = FormOutlined;
Icon.TableOutlined = TableOutlined;
Icon.ProfileOutlined = ProfileOutlined;
Icon.DownOutlined = DownOutlined;
Icon.EllipsisOutlined = EllipsisOutlined;
Icon.InfoCircleOutlined = InfoCircleOutlined;
Icon.CloseCircleOutlined = CloseCircleOutlined;
Icon.RightOutlined = RightOutlined;
Icon.CheckCircleOutlined = CheckCircleOutlined;
Icon.DingdingOutlined = DingdingOutlined;
Icon.GithubOutlined = GithubOutlined;
Icon.FullscreenOutlined = FullscreenOutlined;
Icon.FullscreenExitOutlined = FullscreenExitOutlined;
Icon.MenuUnfoldOutlined = MenuUnfoldOutlined;
Icon.MenuFoldOutlined = MenuFoldOutlined;
Icon.LoadingOutlined = LoadingOutlined;
Icon.IdcardOutlined = IdcardOutlined;
Icon.PoweroffOutlined = PoweroffOutlined;
Icon.CheckOutlined = CheckOutlined;
Icon.BellOutlined = BellOutlined;
Icon.CaretUpOutlined = CaretUpOutlined;
Icon.CaretDownOutlined = CaretDownOutlined;
Icon.StarOutlined = StarOutlined;
Icon.LikeOutlined = LikeOutlined;
Icon.MessageOutlined = MessageOutlined;
Icon.DownloadOutlined = DownloadOutlined;
Icon.PlusOutlined = PlusOutlined;
Icon.AlipayCircleFilled = AlipayCircleFilled;
Icon.TaobaoCircleOutlined = TaobaoCircleOutlined;
Icon.WeiboCircleOutlined = WeiboCircleOutlined;
Icon.EyeOutlined = EyeOutlined;
Icon.EyeInvisibleOutlined = EyeInvisibleOutlined;

export type IconType = keyof typeof Icon;

interface IconProps {
  type?: IconType;
  className?: string;
  style?: CSSProperties;
  rotate?: number;
  spin?: boolean;
  twoToneColor?: string; // (十六进制颜色)
}

export default function Icon({ type, ...iconProps }: IconProps) {
  if (!type) {
    return null;
  }
  const IcomComp = Icon[type];
  return <IcomComp {...iconProps} />;
}
