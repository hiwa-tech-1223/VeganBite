'use client';

import { useState } from 'react';

export interface ReviewFormValues {
  rating: number;
  comment: string;
}

interface ReviewFormProps {
  // 入力欄の初期値。既存レビューがあればその内容。
  // 親は既存レビューが変わったとき key を変えてこのフォームを作り直す（描画後に状態を上書きしない）
  initialValues: ReviewFormValues;
  isEditMode: boolean;
  isLoggedIn: boolean;
  // 未ログインで送信されたときの処理（ログイン画面への遷移など）
  onLoginRequired: () => void;
  // 送信処理。失敗したら例外を投げる（メッセージをフォームに表示する）
  onSubmit: (values: ReviewFormValues) => Promise<void>;
}

// 入力値の検証。エラーが無ければ空のオブジェクトを返す
export function validateReview({ rating, comment }: ReviewFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedComment = comment.trim();

  if (rating < 1 || rating > 5) {
    errors.rating = 'Rating must be between 1 and 5 / 評価は1〜5の間で選択してください';
  }
  if (!trimmedComment) {
    errors.comment = 'Comment is required / コメントを入力してください';
  } else if (trimmedComment.length < 10) {
    errors.comment = `Comment must be at least 10 characters (currently ${trimmedComment.length}) / コメントは10文字以上必要です（現在${trimmedComment.length}文字）`;
  } else if (trimmedComment.length > 1000) {
    errors.comment = `Comment must be at most 1000 characters (currently ${trimmedComment.length}) / コメントは1000文字以内にしてください（現在${trimmedComment.length}文字）`;
  }
  return errors;
}

export function ReviewForm({
  initialValues,
  isEditMode,
  isLoggedIn,
  onLoginRequired,
  onSubmit,
}: ReviewFormProps): React.JSX.Element {
  const [rating, setRating] = useState(initialValues.rating);
  const [comment, setComment] = useState(initialValues.comment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    const errors = validateReview({ rating, comment });
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setValidationErrors({});
    try {
      await onSubmit({ rating, comment });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      setSubmitError(message);
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mt-8">
      <h2 className="text-2xl mb-4" style={{ color: 'var(--text)' }}>
        {isEditMode
          ? 'Edit Your Review / レビューを編集'
          : 'Write a Review / レビューを書く'}
      </h2>
      {isEditMode && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
          You have already reviewed this product. You can edit your review below.
          / この商品はすでにレビュー済みです。以下から編集できます。
        </div>
      )}
      {submitError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block mb-2" style={{ color: 'var(--text)' }}>
            Rating / 評価
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setRating(star);
                  setValidationErrors((prev) => {
                    const rest = { ...prev };
                    delete rest.rating;
                    return rest;
                  });
                }}
                className="text-3xl"
                style={{ color: star <= rating ? 'var(--accent)' : '#ddd' }}
              >
                ★
              </button>
            ))}
          </div>
          {validationErrors.rating && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.rating}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-2" style={{ color: 'var(--text)' }}>
            Comment / コメント
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setValidationErrors((prev) => {
                const rest = { ...prev };
                delete rest.comment;
                return rest;
              });
            }}
            className={`w-full p-3 border rounded-xl focus:outline-none ${
              validationErrors.comment
                ? 'border-red-300 focus:border-red-300'
                : 'border-gray-300 focus:border-[var(--primary)]'
            }`}
            rows={4}
            placeholder="Share your experience... / あなたの体験をシェア..."
            minLength={10}
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            {validationErrors.comment ? (
              <p className="text-sm text-red-600">{validationErrors.comment}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ${
                comment.trim().length > 1000 ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {comment.trim().length}/1000
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-full text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating... / 更新中...'
              : 'Submitting... / 投稿中...'
            : isEditMode
              ? 'Update Review / レビューを更新'
              : 'Submit Review / レビューを投稿'}
        </button>
      </form>
    </div>
  );
}
