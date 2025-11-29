# 📘 Portfolio Website

- GitHub API를 활용하여 별도의 백엔드나 CMS 없이, 리포지토리의 정보를 자동으로 불러와 구성하는 **동적 포트폴리오 웹사이트**입니다.

- 새로운 프로젝트를 진행하고 GitHub에 업로드하기만 하면, 포트폴리오 사이트에 자동으로 반영되는 구조를 가지고 있습니다.

## ✨ 주요 기능 (Key Features)

1.  **GitHub API 연동 자동화**
    *   지정된 GitHub 계정(`githubUser`)의 리포지토리를 자동으로 탐색합니다.
    *   각 리포지토리에 있는 `portfolio.json` 파일 유무를 확인하여 포트폴리오 항목으로 렌더링합니다.

2.  **동적 콘텐츠 렌더링**
    *   **README.md 파싱:** 리포지토리의 README 파일을 가져와 웹사이트 내 모달창에서 마크다운 형태로 보여줍니다. (`marked.js` 사용)
    *   **코드 하이라이팅:** README 내부의 코드 블럭에 문법 강조 효과를 적용합니다. (`highlight.js` 사용)
    *   **미디어 갤러리:** 이미지, 비디오, YouTube 영상 등을 모달 내 슬라이더 형태로 제공합니다.

3.  **성능 최적화 (Caching)**
    *   GitHub API 호출 횟수 제한(Rate Limit)을 고려하여 `localStorage`를 활용한 캐싱 시스템을 구현했습니다. (기본 1시간 유지)

4.  **반응형 웹 디자인 (Responsive Design)**
    *   모바일, 태블릿, 데스크탑 환경에 맞춰 최적화된 UI를 제공합니다.
    *   세련된 Glassmorphism 스타일의 모달 디자인을 적용했습니다.

## 🛠 사용 기술 (Tech Stack)

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Libraries:**
    *   [jQuery](https://jquery.com/) (DOM 조작 및 이벤트 처리)
    *   [Marked.js](https://marked.js.org/) (Markdown → HTML 변환)
    *   [Highlight.js](https://highlightjs.org/) (소스코드 구문 강조)
    *   Google Fonts (Noto Sans KR, Poppins)

## 📂 프로젝트 구조 (File Structure)

```bash
📦 Portfolio-Project
 ┣ 📜 index.html      # 메인 HTML 구조
 ┣ 📜 style.css       # 전체 스타일 및 반응형 디자인
 ┣ 📜 script.js       # GitHub API 호출, 모달 제어, 데이터 바인딩 로직
 ┗ 📂 media           # 프로필 사진, 이력서 PDF 등 정적 자산
    ┣ 📜 김준섭 - 자기소개서.pdf
    ┗ 📂 img
       ┗ 📜 김준섭.jpg
```

## 리포지토리 명명 규칙 및 최적화 (Naming Convention & Optimization)

**2024.11 업데이트:** GitHub API 호출 제한(Rate Limit)을 방지하고 로딩 속도를 높이기 위해 로직이 개선되었습니다.

1.  **접미사 필터링**: 리포지토리 이름이 대소문자 구분 없이 **`proj` 또는 `public`으로 끝나는 경우**에만 포트폴리오 목록으로 가져옵니다.
    *   ✅ `ai-chatbot-proj`, `backend-server-proj`, `Portfolio-proj`
    *   ❌ `hello-world`, `study-algorithm`
    > **Note:** 기존 리포지토리를 포트폴리오에 띄우려면 이름을 `xxx-proj` 형태로 변경하거나, `script.js`의 필터링 조건을 수정하세요.

2.  **탐색 범위 확장**: 기본 API 호출(30개) 제한을 넘어, 최근 업데이트순으로 **최대 100개**의 리포지토리를 한 번에 조회하도록 개선되었습니다(`per_page=100`). 리포지토리 개수가 많아도 누락 없이 불러올 수 있습니다.