// src/api.ts

// 백엔드 서버가 완성되면 이 주소를 진짜 서버 주소로 변경하면 됩니다.
const BASE_URL = "http://localhost:8000";

// 1. 음원 목록 가져오기 API (전해줄 준비)
export async function fetchTracks() {
  try {
    const response = await fetch(`${BASE_URL}/api/tracks`);
    if (!response.ok) throw new Error("네트워크 응답 오류");
    return await response.json();
  } catch (error) {
    console.warn("백엔드 연결 전이므로 가짜 데이터를 반환하거나 에러를 처리합니다.", error);
    return null;
  }
}

// 2. 음원 업로드 API (준비)
export async function uploadTrackApi(formData: FormData) {
  const response = await fetch(`${BASE_URL}/api/tracks`, {
    method: "POST",
    body: formData,
  });
  return await response.json();
}