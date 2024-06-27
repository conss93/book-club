// DOM이 완전히 로드되면 실행되는 이벤트 리스너
document.addEventListener('DOMContentLoaded', (event) => {
    loadComments(); // 댓글을 로드하는 함수 호출
    document.getElementById('loginPopup').style.display = 'block'; // 로그인 팝업을 표시
});

// 팝업을 표시하는 함수
function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'block';
}

// 팝업을 숨기는 함수
function hidePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// 로그인 팝업을 표시하는 함수
function showLogin() {
    hidePopup('idCreatePopup'); // ID 생성 팝업 숨기기
    hidePopup('passwordResetPopup'); // 비밀번호 재설정 팝업 숨기기
    showPopup('loginPopup'); // 로그인 팝업 표시
}

// ID 생성 팝업을 표시하는 함수
function showIdCreate() {
    hidePopup('loginPopup'); // 로그인 팝업 숨기기
    showPopup('idCreatePopup'); // ID 생성 팝업 표시
}

// 비밀번호 재설정 팝업을 표시하는 함수
function showPasswordReset() {
    hidePopup('loginPopup'); // 로그인 팝업 숨기기
    showPopup('passwordResetPopup'); // 비밀번호 재설정 팝업 표시
}

// 로그인 함수
function login() {
    const name = document.getElementById('loginName').value; // 입력된 이름
    const password = document.getElementById('loginPassword').value; // 입력된 비밀번호

    // Firebase Firestore에서 해당 이름과 비밀번호를 가진 사용자 찾기
    db.collection("users").where("name", "==", name).where("password", "==", password)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    localStorage.setItem('currentUser', JSON.stringify(doc.data())); // 현재 사용자 정보를 로컬 스토리지에 저장
                    hidePopup('loginPopup'); // 로그인 팝업 숨기기
                });
            } else {
                alert('로그인 정보가 올바르지 않습니다.'); // 사용자를 찾을 수 없을 때 알림
            }
        })
        .catch((error) => {
            console.error("Error logging in: ", error); // 로그인 중 에러 발생 시 콘솔에 출력
        });
}

// ID 생성 함수
function createId() {
    const name = document.getElementById('createName').value; // 입력된 이름
    const password = document.getElementById('createPassword').value; // 입력된 비밀번호
    const confirmPassword = document.getElementById('confirmPassword').value; // 확인 비밀번호
    const rrn = document.getElementById('rrn').value; // 입력된 주민등록번호 뒷자리

    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.'); // 비밀번호가 일치하지 않을 때 알림
        return;
    }

    if (isNaN(rrn) || rrn.length !== 7) {
        alert('주민등록번호 뒷자리 형식이 잘못되었습니다.'); // 주민등록번호 형식이 잘못되었을 때 알림
        return;
    }

    const user = { name, password, rrn }; // 사용자 객체 생성
    db.collection("users").add(user) // Firebase Firestore에 사용자 정보 저장
        .then(() => {
            alert('ID가 생성되었습니다.'); // ID 생성 완료 알림
            showLogin(); // 로그인 팝업 표시
        })
        .catch((error) => {
            console.error("Error creating ID: ", error); // ID 생성 중 에러 발생 시 콘솔에 출력
        });
}

// 비밀번호 재설정 함수
function resetPassword() {
    const name = document.getElementById('resetName').value; // 입력된 이름
    const rrn = document.getElementById('resetRrn').value; // 입력된 주민등록번호 뒷자리
    const newPassword = document.getElementById('newPassword').value; // 새 비밀번호
    const confirmNewPassword = document.getElementById('confirmNewPassword').value; // 새 비밀번호 확인

    if (newPassword !== confirmNewPassword) {
        alert('비밀번호가 일치하지 않습니다.'); // 비밀번호가 일치하지 않을 때 알림
        return;
    }

    // Firebase Firestore에서 해당 이름과 주민등록번호를 가진 사용자 찾기
    db.collection("users").where("name", "==", name).where("rrn", "==", rrn)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    db.collection("users").doc(doc.id).update({
                        password: newPassword
                    }); // 비밀번호 업데이트
                    alert('비밀번호가 재설정되었습니다.'); // 비밀번호 재설정 완료 알림
                    showLogin(); // 로그인 팝업 표시
                });
            } else {
                alert('입력 정보가 올바르지 않습니다.'); // 사용자를 찾을 수 없을 때 알림
            }
        })
        .catch((error) => {
            console.error("Error resetting password: ", error); // 비밀번호 재설정 중 에러 발생 시 콘솔에 출력
        });
}

// 댓글을 로드하는 함수
function loadComments() {
    const commentSection = document.getElementById('comments'); // 댓글을 표시할 섹션
    commentSection.innerHTML = ''; // 기존 댓글 초기화

    // Firebase Firestore에서 댓글을 가져오기
    db.collection("comments").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                displayComment(doc.data()); // 댓글을 화면에 표시
            });
        })
        .catch((error) => {
            console.error("Error loading comments: ", error); // 댓글 로드 중 에러 발생 시 콘솔에 출력
        });
}

// 댓글을 추가하는 함수
function addComment() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')); // 현재 로그인된 사용자 정보
    if (!currentUser) {
        alert('로그인이 필요합니다.'); // 로그인 필요 알림
        showLogin(); // 로그인 팝업 표시
        return;
    }

    const booktitle = document.getElementById('booktitle').value; // 입력된 책 제목
    const rating = document.querySelector('input[name="rating"]:checked').value; // 선택된 평점
    const content = document.getElementById('content').value; // 입력된 내용
    const datetime = new Date().toLocaleString(); // 현재 날짜와 시간

    if (booktitle && rating && content) {
        const newComment = {
            nickname: currentUser.name,
            booktitle,
            rating,
            content,
            datetime,
            id: new Date().getTime().toString() // 댓글 ID로 현재 시간의 타임스탬프 사용
        };
        db.collection("comments").doc(newComment.id).set(newComment) // Firebase Firestore에 댓글 저장
            .then(() => {
                displayComment(newComment); // 댓글을 화면에 표시
                document.getElementById('booktitle').value = ''; // 입력 필드 초기화
                document.getElementById('content').value = ''; // 입력 필드 초기화
                document.querySelector('input[name="rating"]:checked').checked = false; // 선택된 평점 초기화
            })
            .catch((error) => {
                console.error("Error adding comment: ", error); // 댓글 추가 중 에러 발생 시 콘솔에 출력
            });
    } else {
        alert('모든 필드를 입력해주세요.'); // 모든 필드를 입력하라는 알림
    }
}

// 댓글을 화면에 표시하는 함수
function displayComment(comment) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')); // 현재 로그인된 사용자 정보
    const commentSection = document.getElementById('comments'); // 댓글을 표시할 섹션
    const newComment = document.createElement('div'); // 새로운 댓글 요소 생성
    newComment.classList.add('comment'); // 댓글 클래스 추가
    newComment.innerHTML = `
        <p class="nickname">${comment.nickname}</p>
        <p class="book-title">책 제목: ${comment.booktitle}</p>
        <p class="rating"> ${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</p>
        <p>${comment.content}</p>
        <p class="datetime">${comment.datetime}</p>
        ${currentUser && currentUser.name === comment.nickname ? `<button onclick="confirmDelete('${comment.id}')">삭제</button>` : ''}
    `; // 댓글 내용 설정
    commentSection.insertBefore(newComment, commentSection.firstChild); // 새로운 댓글을 맨 위에 추가
}

// 댓글 삭제 확인 함수
function confirmDelete(commentId) {
    const result = confirm('정말 이 댓글을 삭제하시겠습니까?'); // 삭제 확인 알림
    if (result) {
        deleteComment(commentId); // 댓글 삭제 함수 호출
    }
}

// 댓글 삭제 함수
function deleteComment(commentId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')); // 현재 로그인된 사용자 정보
    db.collection("comments").doc(commentId).get()
        .then((doc) => {
            if (doc.exists && doc.data().nickname === currentUser.name) {
                db.collection("comments").doc(commentId).delete() // Firebase Firestore에서 댓글 삭제
                    .then(() => {
                        loadComments(); // 댓글을 다시 로드
                    })
                    .catch((error) => {
                        console.error("Error deleting comment: ", error); // 댓글 삭제 중 에러 발생 시 콘솔에 출력
                    });
            } else {
                alert('댓글을 삭제할 권한이 없습니다.'); // 댓글 삭제 권한 없음을 알림
            }
        })
        .catch((error) => {
            console.error("Error getting comment: ", error); // 댓글 가져오는 중 에러 발생 시 콘솔에 출력
        });
}
