import styles from './HomeHeadline.module.css';

type Props = {
  /** \n 포함 가능. 기본값은 ko 히어로 카피 */
  text?: string;
};

export function HomeHeadline({ text = '세상에 하나뿐인\n나만의 이야기' }: Props) {
  return <h1 className={styles.headline}>{text}</h1>;
}
