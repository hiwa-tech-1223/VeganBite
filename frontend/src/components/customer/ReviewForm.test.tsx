import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewForm, ReviewFormValues, validateReview } from './ReviewForm';

const VALID_COMMENT = 'とても美味しかったです。また買います。';

function renderForm(overrides: Partial<React.ComponentProps<typeof ReviewForm>> = {}) {
  const onSubmit = jest.fn<Promise<void>, [ReviewFormValues]>().mockResolvedValue(undefined);
  const onLoginRequired = jest.fn();
  render(
    <ReviewForm
      initialValues={{ rating: 5, comment: '' }}
      isEditMode={false}
      isLoggedIn
      onLoginRequired={onLoginRequired}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit: overrides.onSubmit ?? onSubmit, onLoginRequired: overrides.onLoginRequired ?? onLoginRequired };
}

describe('ReviewForm', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('既存レビューの内容を初期値として表示する', () => {
    renderForm({ initialValues: { rating: 3, comment: '前回のレビュー本文です。' }, isEditMode: true });

    expect(screen.getByRole('textbox')).toHaveValue('前回のレビュー本文です。');
    expect(screen.getByText('Edit Your Review / レビューを編集')).toBeInTheDocument();
  });

  it('入力した評価とコメントで送信する', async () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getAllByRole('button', { name: '★' })[3]);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_COMMENT } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: VALID_COMMENT }));
  });

  it('コメントが短いと送信せずにエラーを表示する', () => {
    const { onSubmit } = renderForm();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '短い' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/コメントは10文字以上必要です/)).toBeInTheDocument();
  });

  it('未ログインで送信するとログインを求め、検証も送信もしない', () => {
    const { onSubmit, onLoginRequired } = renderForm({ isLoggedIn: false });

    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }));

    expect(onLoginRequired).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/コメントを入力してください/)).not.toBeInTheDocument();
  });

  it('送信に失敗したらメッセージを表示する', async () => {
    const onSubmit = jest.fn<Promise<void>, [ReviewFormValues]>().mockRejectedValue(new Error('already reviewed'));
    renderForm({ onSubmit });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_COMMENT } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }));

    expect(await screen.findByText('already reviewed')).toBeInTheDocument();
  });
});

describe('validateReview', () => {
  it('正しい入力ならエラーなし', () => {
    expect(validateReview({ rating: 5, comment: VALID_COMMENT })).toEqual({});
  });

  it('空のコメントはエラー', () => {
    expect(validateReview({ rating: 5, comment: '   ' }).comment).toContain('コメントを入力してください');
  });

  it('1000 文字を超えるとエラー', () => {
    expect(validateReview({ rating: 5, comment: 'あ'.repeat(1001) }).comment).toContain('1000文字以内');
  });

  it('評価が範囲外ならエラー', () => {
    expect(validateReview({ rating: 0, comment: VALID_COMMENT }).rating).toBeDefined();
  });
});
