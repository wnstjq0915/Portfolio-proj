/**
 * 기능 로직은 기존과 동일하게 유지하되, 
 * UI 제어(클래스 토글 등) 부분만 새로운 디자인에 맞게 최적화되었습니다.
 */

const githubUser = "wnstjq0915"; // ★ 본인 깃허브 아이디
const STORAGE_KEY = `portfolio_v2_${githubUser}`; // 캐시 키 변경 (충돌 방지)
const CACHE_DURATION = 1000 * 60 * 60; // 1시간 캐시

// 모달 상태 관리
let currentMediaList = [];
let currentMediaIndex = 0;
let projectsData = [];

// --- 유틸리티 함수 ---
function formatDate(dateString) {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
    });
}

function safeJsonParse(text) {
    try { return JSON.parse(text); }
    catch(e) { return null; }
}

function extractH1(md) {
    const match = md && md.match(/^#\s*(.+)/m);
    return match ? match[1].trim() : null;
}

function extractDescription(md) {
    if (!md) return "상세 설명은 상세보기를 클릭하세요.";
    // 첫 번째 리스트 아이템 혹은 첫 번째 문단을 추출
    const match = md.match(/^[ \t]*[-*+]\s+(.+)/m);
    if (match) {
        let text = match[1].replace(/\[.*\]\(.*\)/g, '').replace(/`.*?`/g, '').trim();
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }
    return "상세 내용은 클릭하여 확인하세요.";
}

// --- 데이터 로딩 (캐싱 포함) ---
async function fetchProjects() {
    const $loading = $("#loading-message");
    
    // 1. 캐시 확인
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log("Loaded from local cache");
            renderProjects(data);
            $loading.hide();
            return;
        }
    }

    // 2. API 호출
    try {
        const repoRes = await fetch(`https://api.github.com/users/${githubUser}/repos?type=owner&sort=updated`);
        if (!repoRes.ok) throw new Error("GitHub API Error");
        
        const repos = await repoRes.json();
        const tempProjects = [];

        // 병렬 처리 대신 순차 처리로 API 부하 조절
        for (const repo of repos) {
            const contentsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/`;
            const contentsRes = await fetch(contentsUrl);
            const contents = contentsRes.ok ? await contentsRes.json() : [];

            if (!Array.isArray(contents)) continue;

            const pfFile = contents.find(f => f.name === "portfolio.json");
            if (!pfFile) continue; // portfolio.json 없으면 패스

            const readmeFile = contents.find(f => f.name.toLowerCase() === "readme.md");

            // 파일 내용 가져오기
            const pfText = await fetch(pfFile.download_url).then(r => r.text());
            const readmeText = readmeFile ? await fetch(readmeFile.download_url).then(r => r.text()) : "";

            const pfJson = safeJsonParse(pfText);
            if (!pfJson) continue;

            const title = extractH1(readmeText) || repo.name;
            const desc = extractDescription(readmeText);
            
            // 썸네일 결정 (img 타입 중 첫번째, 없으면 기본값)
            const thumbUrl = pfJson.list.find(i => i.type === 'img')?.url || 'https://via.placeholder.com/400x250?text=No+Image';

            tempProjects.push({
                repoName: repo.name,
                title: title,
                desc: desc,
                thumb: thumbUrl,
                media: pfJson.list,
                readme: readmeText,
                repoUrl: repo.html_url,
                homepage: repo.homepage,
                updated: repo.pushed_at
            });
        }

        // 3. 저장 및 렌더링
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: tempProjects
        }));

        renderProjects(tempProjects);

    } catch (err) {
        console.error(err);
        $loading.html("<p>❌ 프로젝트 정보를 불러오지 못했습니다.<br>잠시 후 다시 시도해주세요.</p>");
    } finally {
        $loading.hide();
    }
}

function renderProjects(projects) {
    projectsData = projects; // 전역 저장
    const $list = $("#project-list");

    if (projects.length === 0) {
        $list.html("<p style='grid-column: 1/-1; text-align:center;'>표시할 프로젝트가 없습니다.</p>");
        return;
    }

    const html = projects.map((p, idx) => `
        <div class="project-card">
            <div class="project-thumb">
                <img src="${p.thumb}" alt="${p.title}" loading="lazy">
            </div>
            <div class="project-info">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
                <div class="btn-view" onclick="openModal(${idx})">View Details</div>
            </div>
        </div>
    `).join('');

    $list.html(html);
}

// --- 모달 로직 ---
const $modal = $("#project-modal");
const $modalTitle = $("#modal-title");
const $modalLinks = $("#modal-links");
const $previewContainer = $("#main-preview");
const $thumbsContainer = $("#modal-thumbs");
const $readmeContainer = $("#modal-readme");

window.openModal = function(index) {
    const p = projectsData[index];
    if (!p) return;

    $modalTitle.text(p.title);
    
    // 링크 생성
    let links = `<span>🕒 Updated: ${formatDate(p.updated)}</span>`;
    links += `<a href="${p.repoUrl}" target="_blank">🔗 GitHub Repo</a>`;
    if (p.homepage) {
        links += `<a href="${p.homepage}" target="_blank">🌐 Live Demo</a>`;
    }
    $modalLinks.html(links);

    // 미디어 설정
    currentMediaList = p.media || [];
    currentMediaIndex = 0;
    renderMediaUI();

    // 마크다운 파싱 및 하이라이팅
    $readmeContainer.html(marked.parse(p.readme || "No README file."));
    hljs.highlightAll();

    // 모달 표시
    $modal.fadeIn(200);
    $("body").addClass("modal-open");
};

window.closeModal = function() {
    $modal.fadeOut(200);
    $("body").removeClass("modal-open");
    
    // 영상/오디오 정지
    $previewContainer.find("video, iframe").each(function() {
        if(this.tagName === 'VIDEO') this.pause();
        else $(this).attr('src', $(this).attr('src'));
    });
};

function renderMediaUI() {
    if (currentMediaList.length === 0) {
        $previewContainer.hide();
        $thumbsContainer.hide();
        return;
    }
    $previewContainer.show();
    $thumbsContainer.show();

    // 썸네일 생성
    const thumbsHtml = currentMediaList.map((m, i) => {
        let src = "";
        if (m.type === 'img') src = m.url;
        else if (m.type === 'video') src = "media/img/video_placeholder.png"; // 실제론 캡처 필요하지만 대체 아이콘
        else if (m.type === 'youtube') src = `https://img.youtube.com/vi/${m.url}/default.jpg`;

        return `<img src="${src}" class="thumb-item ${i === 0 ? 'active' : ''}" 
                 onclick="changeMedia(${i})" onerror="this.src='https://via.placeholder.com/100?text=Media'">`;
    }).join('');
    
    $thumbsContainer.html(thumbsHtml);
    showMedia(0);
}

window.changeMedia = function(index) {
    currentMediaIndex = index;
    showMedia(index);
    
    // 썸네일 활성화 스타일 갱신
    $(".thumb-item").removeClass("active");
    $(".thumb-item").eq(index).addClass("active");
}

function showMedia(index) {
    const item = currentMediaList[index];
    if (!item) return;

    // 화살표는 남기고 내부 콘텐츠만 교체
    $previewContainer.find("img, video, iframe").remove();

    let el;
    if (item.type === 'img') {
        el = `<img src="${item.url}" alt="Project Media">`;
    } else if (item.type === 'video') {
        el = `<video src="${item.url}" controls autoplay muted></video>`;
    } else if (item.type === 'youtube') {
        el = `<iframe src="https://www.youtube.com/embed/${item.url}?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>`;
    }

    $previewContainer.append(el);
}

// --- 이벤트 바인딩 ---
$(document).ready(function() {
    fetchProjects();

    // 모달 배경 클릭 시 닫기
    $(window).click(function(e) {
        if ($(e.target).is($modal)) closeModal();
    });

    // 키보드 ESC 닫기
    $(document).keydown(function(e) {
        if (e.key === "Escape") closeModal();
    });

    // 화살표 클릭 이벤트
    $(".arrow-left").click(function() {
        if (currentMediaList.length < 2) return;
        let newIdx = currentMediaIndex - 1;
        if (newIdx < 0) newIdx = currentMediaList.length - 1;
        changeMedia(newIdx);
    });

    $(".arrow-right").click(function() {
        if (currentMediaList.length < 2) return;
        let newIdx = (currentMediaIndex + 1) % currentMediaList.length;
        changeMedia(newIdx);
    });
});