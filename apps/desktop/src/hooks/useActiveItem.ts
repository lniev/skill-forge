import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getItemPath(itemId: string) {
  return itemId === "dashboard" ? "/" : `/${itemId}`;
}

export function useActiveItem() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeItem = useMemo(() => {
    const path = location.pathname.replace(/^\//, "");
    return path || "dashboard";
  }, [location.pathname]);

  function navigateTo(itemId: string) {
    const targetPath = getItemPath(itemId);
    if (location.pathname === targetPath) {
      // 点击当前已激活菜单时刷新页面数据
      window.location.reload();
      return;
    }
    navigate(targetPath);
  }

  return { activeItem, navigateTo };
}
