import { CaptionEditor } from "@/components/editor/CaptionEditor";
import { NavBar } from "@/components/layout/NavBar";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 네비게이션 바 */}
      <NavBar />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 min-h-0">
        <CaptionEditor />
      </div>
    </div>
  );
}
