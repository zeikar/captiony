import { CaptionEditor } from "@/components/editor/CaptionEditor";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Captiony
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Web-based subtitle editor - Add and edit subtitles for your videos with ease
          </p>
        </div>

        <CaptionEditor />
      </div>
    </div>
  );
}
