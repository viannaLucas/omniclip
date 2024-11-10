import {Op, html, watch} from "@benev/slate"

import {styles} from "./styles.js"
import {shadow_view} from "../../../../context/context.js"
import saveSvg from "../../../../icons/gravity-ui/save.svg.js"
import exportSvg from "../../../../icons/gravity-ui/export.svg.js"
import {StateHandler} from "../../../../views/state-handler/view.js"
import circleInfoSvg from "../../../../icons/gravity-ui/circle-info.svg.js"

export const Export = shadow_view(use => () => {
	use.styles(styles)
	use.watch(() => use.context.state)

	const compositor = use.context.controllers.compositor
	const video_export = use.context.controllers.video_export
	const state = use.context.state
	const [logs, setLogs, getLogs] = use.state<string[]>([])

	use.mount(() => {
		const dispose = watch.track(() => use.context.state.log, (log) => {
			if(getLogs().length === 20) {
				const new_arr = getLogs().slice(1)
				setLogs(new_arr)
			}
			setLogs([...getLogs(), log])
		})
		return () => dispose()
	})

	const dialog = use.defer(() => use.shadow.querySelector("dialog"))
	if(use.context.state.is_exporting) {
		dialog?.showModal()
	}

	const renderAspectRatio = () => {
		const aspectRatio = state.settings.aspectRatio
		return html`
			<div class=aspect-ratios>
				<h4>Aspect Ratio</h4>
				<div class=cnt>
					<div class="shape" style="aspect-ratio: ${aspectRatio}"></div>
					<div class=info>
						${aspectRatio === "21/9"
							? "Ultra-Wide"
							: aspectRatio === "9/16"
							?  "Vertical"
							: aspectRatio === "16/9"
							? "Wide"
							: aspectRatio === "1/1"
							? "Square"
							: aspectRatio === "4/3"
							? "Standard"
							: aspectRatio === "3/2"
							? "Balanced"
							: null}
						</div>
					<div class=aspect-ratio>${aspectRatio}</div>
				</div>
			</div>
		`
	}

	return StateHandler(Op.all(
		use.context.helpers.ffmpeg.is_loading.value,
		use.context.is_webcodecs_supported.value), () => html`
		<div class="flex">
			<dialog @cancel=${(e: Event) => e.preventDefault()}>
				<div class="box">
					${state.is_exporting
						? html`
							${compositor.canvas.getElement()}
						`
						: null}
					<div class=progress>
						<div class=stats>
							<span class=percentage>
								Progress ${state.export_status === "complete" || state.export_status === "flushing"
									? "100"
									: state.export_progress.toFixed(2)}
								%
							</span>
							<span class=status>Status: ${state.export_status}</span>
						</div>
						<div class=progress-bar>
							<div
								class="bar"
								style="
									width: ${state.export_status === "complete" || state.export_status === "flushing"
										? "100"
										: state.export_progress.toFixed(2)
								}%"
							>
							</div>
						</div>
						<div class=buttons>
							<button
								@click=${() => {
									dialog?.close()
									video_export.resetExporter(use.context.state)
								}}
								class="cancel"
								?data-complete=${state.export_status === "complete"}
							>
								${state.export_status === "complete" ? "Continue editing" : "Cancel Export"}
							</button>
							<button
								@click=${() => video_export.save_file()}
								class="sparkle-button save-button"
								.disabled=${state.export_status !== "complete"}
							>
								<span  class="spark"></span>
								<span class="backdrop"></span>
								${saveSvg}
								<span class=text>save</span>
							</button>
						</div>
					</div>
				</div>
			</dialog>
			<div class=export>
				<h2>Export</h2>
				<p>${circleInfoSvg} Your video will export with the following settings:</p>
				<div class=selected-settings>
					${renderAspectRatio()}
					<div>
						<h4>Resolution</h4>
						<span>${state.settings.width}x${state.settings.height} (${state.settings.standard})</span>
					</div>
					<div>
						<h4>Timebase</h4>
						<span>${state.timebase} fps</span>
					</div>
					<div>
						<h4>Bitrate</h4>
						<span>${state.settings.bitrate} kbps</span>
					</div>
					<button ?disabled=${state.settings.bitrate <= 0} class="sparkle-button" @click=${() => video_export.export_start(use.context.state, state.settings.bitrate)}>
						<span class="text">${exportSvg}<span>Export</span></span>
					</button>
				</div>
			</div>
		</div>
	`)
})
