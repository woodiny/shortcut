// src/popup/index.tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface Shortcut {
    id: string;
    title: string;
    time: string;
    targetUrl: string;
    script: string;
}

// chrome.storage와 연동하는 헬퍼 함수들
const getShortcuts = (): Promise<Shortcut[]> => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(['shortcuts'], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(result.shortcuts || []);
            });
        } catch (error) {
            reject(error);
        }
    });
};

const setShortcuts = (shortcuts: Shortcut[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ shortcuts }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
};

// 현재 활성 탭의 URL을 가져오는 함수
const getCurrentTabUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError || !tabs[0]?.url) {
                    return reject(chrome.runtime.lastError || new Error('No active tab found'));
                }
                resolve(tabs[0].url);
            });
        } catch (error) {
            reject(error);
        }
    });
};

const Popup: React.FC = () => {
    const [shortcuts, setLocalShortcuts] = useState<Shortcut[]>([]);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [formData, setFormData] = useState<Shortcut>({
        id: '',
        title: '',
        time: '',
        targetUrl: '',
        script: '',
    });
    const [editing, setEditing] = useState<boolean>(false);

    // 초기 로딩: 저장된 shortcut과 현재 탭 URL 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const [storedShortcuts, url] = await Promise.all([getShortcuts(), getCurrentTabUrl()]);
                setCurrentUrl(url);
                // 대상 URL이 현재 탭과 일치하는 shortcut을 우선 정렬
                const sorted = storedShortcuts.sort((a, b) => {
                    if (a.targetUrl === url && b.targetUrl !== url) return -1;
                    if (a.targetUrl !== url && b.targetUrl === url) return 1;
                    return 0;
                });
                setLocalShortcuts(sorted);
            } catch (error: any) {
                alert('에러가 발생했습니다: ' + error.message);
            }
        };
        loadData();
    }, []);

    const resetForm = () => {
        setFormData({
            id: '',
            title: '',
            time: '',
            targetUrl: '',
            script: '',
        });
        setEditing(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddOrUpdate = async () => {
        try {
            if (!formData.title || !formData.targetUrl || !formData.script) {
                alert('필수 항목(제목, 대상 URL, 스크립트)을 입력하세요.');
                return;
            }
            let updatedShortcuts = [...shortcuts];
            if (editing) {
                // 수정
                updatedShortcuts = updatedShortcuts.map((s) =>
                    s.id === formData.id ? { ...formData } : s
                );
            } else {
                // 추가: 고유 id 생성
                const newShortcut = { ...formData, id: Date.now().toString() };
                updatedShortcuts.push(newShortcut);
            }
            await setShortcuts(updatedShortcuts);
            // 대상 URL이 현재 탭과 일치하는 shortcut을 우선 정렬
            const sorted = updatedShortcuts.sort((a, b) => {
                if (a.targetUrl === currentUrl && b.targetUrl !== currentUrl) return -1;
                if (a.targetUrl !== currentUrl && b.targetUrl === currentUrl) return 1;
                return 0;
            });
            setLocalShortcuts(sorted);
            resetForm();
        } catch (error: any) {
            alert('에러가 발생했습니다: ' + error.message);
        }
    };

    const handleEdit = (shortcut: Shortcut) => {
        setFormData(shortcut);
        setEditing(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const updatedShortcuts = shortcuts.filter((s) => s.id !== id);
            await setShortcuts(updatedShortcuts);
            setLocalShortcuts(updatedShortcuts);
        } catch (error: any) {
            alert('에러가 발생했습니다: ' + error.message);
        }
    };

    const handleExecute = (shortcut: Shortcut) => {
        try {
            // 저장된 스크립트를 실행
            chrome.tabs.executeScript(
                {
                    code: shortcut.script,
                },
                () => {
                    if (chrome.runtime.lastError) {
                        alert('에러가 발생했습니다: ' + chrome.runtime.lastError.message);
                    }
                }
            );
        } catch (error: any) {
            alert('에러가 발생했습니다: ' + error.message);
        }
    };

    return (
        <div className="container">
            <h1>Shortcut</h1>
            <div className="form">
                <div className="form-group">
                    <label>제목</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label>시간</label>
                    <input
                        type="text"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label>대상 URL</label>
                    <input
                        type="text"
                        name="targetUrl"
                        value={formData.targetUrl}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label>스크립트</label>
                    <textarea
                        name="script"
                        value={formData.script}
                        onChange={handleInputChange}
                    ></textarea>
                </div>
                <div className="button-group">
                    <button className="button" onClick={handleAddOrUpdate}>
                        {editing ? '수정' : '추가'}
                    </button>
                    {editing && (
                        <button className="button button-danger" onClick={resetForm}>
                            취소
                        </button>
                    )}
                </div>
            </div>
            <hr />
            <h2>Shortcut list</h2>
            <ul className="shortcut-list">
                {shortcuts.map((shortcut) => (
                    <li key={shortcut.id} className="shortcut-item">
                        <div className="shortcut-header">
                            <span className="shortcut-title">{shortcut.title}</span>
                            <div>
                                <button className="button" onClick={() => handleEdit(shortcut)}>
                                    수정
                                </button>
                                <button
                                    className="button button-danger"
                                    onClick={() => handleDelete(shortcut.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                        <div className="shortcut-time">{shortcut.time}</div>
                        <div className="button-group" style={{ marginTop: '10px' }}>
                            <button className="button" onClick={() => handleExecute(shortcut)}>
                                실행
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(<Popup />);
}
