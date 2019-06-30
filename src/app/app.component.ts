import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as uuid from 'uuid';

// データ
interface Datum {
  name: string;
  value: number;
  primary?: boolean;
}

type Data = Datum[];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {
  readonly svgWidth = 600;
  readonly svgHeight = 300;

  // svgのid属性にバインドするランダム値
  readonly svgId = `svg_${uuid.v4()}`;

  // SVG内部の余白を定義します
  private readonly svgMargin = {
    left: 25,
    right: 5,
    top: 5,
    bottom: 15
  };

  // svgのルート要素を取得します
  private get svgRootElement() {
    return d3.select(`#${this.svgId}`);
  }

  // 指定したセレクタの全要素を取得します
  private svgSelectAll<T extends SVGElement>(selector: string) {
    return this.svgRootElement.selectAll<T, Datum>(selector);
  }

  // svg配下のrect要素を取得します
  private get svgRectElements() {
    return this.svgSelectAll<SVGRectElement>('rect');
  }

  // svg配下のrect要素を取得します
  private get svgForeignObjectElements() {
    return this.svgSelectAll<SVGForeignObjectElement>('foreignObject');
  }

  /**
   * 初期化処理
   */
  ngAfterViewInit() {
    const data = [
      { name: '競合A社', value: 53 },
      { name: '当社', value: 72, primary: true },
      { name: '競合B社', value: 81 },
      { name: '競合C社', value: 69 },
      { name: '競合D社', value: 57 },
      { name: '競合E社', value: 34 },
      { name: '競合F社', value: 13 },
    ];
    this.updateSvg(data);
  }

  /**
   * 与えられたデータに基づき、表示を更新します
   * @param data データ配列
   */
  updateSvg(data: Data = []) {
    this.updateAxises(data);  // 軸の表示を更新します
    this.updateBars(data);    // バーの表示を更新します
    this.updateLabels(data);  // ラベルの表示を更新します
  }

  /**
   * 与えられたデータに基づき、矩形の位置とサイズを計算して
   * D3オブジェクトに設定します。
   * @param selection D3のSelectionオブジェクト
   * @param data バインドするデータ（省略可能）。
   */
  private setSizeAndPositionToRect<T extends d3.BaseType>(
    selection: d3.Selection<T, Datum, d3.BaseType, unknown>,
    data: Data = selection.data()) {

    const [x, y] = [this.xScale(data), this.yScale(data)];

    return selection
      .attr('x', d => x(d.name))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => this.svgHeight - this.svgMargin.bottom - y(d.value));
  }

  /**
   * x座標計算用のメソッドです
   * 与えられたデータを、svg上の表示用座標に変換します
   */
  private xScale(data: Data = []) {
    return d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([this.svgMargin.left, this.svgWidth - this.svgMargin.right])
      .padding(0.4);
  }

  /**
   * y座標計算用のメソッドです
   * 与えられたデータを、svg上の表示用座標に変換します
   */
  private yScale(data: Data = []) {
    return d3.scaleLinear()
      .domain([0, d3.max(data.map(d => d.value))])
      .range([this.svgHeight - this.svgMargin.bottom, this.svgMargin.top])
      .nice();
  }

  /**
   * グラフ本体の描画を更新します
   */
  private updateBars(data: Data = []) {
    const rects = this.svgRectElements
      .data(data);

    this.setSizeAndPositionToRect(
      rects
        .enter()
        .append('rect')
        .merge(rects))
      .classed('primaryBar', d => d.primary)
      .classed('secondaryBar', d => !d.primary);

    rects.exit().remove();
  }

  /**
   * ラベルの描画を更新します
   */
  private updateLabels(data: Data = []) {
    const dataLabels = this.svgForeignObjectElements
      .data(data);

    this.setSizeAndPositionToRect(dataLabels, data)
      .select('xhtml\\:div')  // コロンは「\\」でエスケープする必要がある
      .text(d => `${d.value}pts`);

    this.setSizeAndPositionToRect(
      dataLabels
        .enter()
        .append('foreignObject'),
      data)
      .append('xhtml:div')
      .classed('label', true)
      .classed('primaryLabel', d => d.primary)
      .classed('secondaryLabel', d => !d.primary)
      .text(d => `${d.value}pts`);

    dataLabels.exit().remove();
  }

  /**
   * 軸の描画を更新します
   */
  private updateAxises(data: Data = []) {
    this.svgRootElement
      .selectAll('.axis')
      .remove();

    this.svgRootElement
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${this.svgHeight - this.svgMargin.bottom})`)
      .call(d3.axisBottom(this.xScale(data))
        .tickSize(0));

    this.svgRootElement
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${this.svgMargin.left}, 0)`)
      .call(d3.axisLeft(this.yScale(data))
        .tickSize(- this.svgWidth + (this.svgMargin.left + this.svgMargin.right)));
  }
}
