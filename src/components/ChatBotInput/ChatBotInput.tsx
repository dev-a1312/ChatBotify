
import { useState, ChangeEvent, FormEvent, KeyboardEvent, RefObject, useEffect, MouseEvent } from "react";

import SendButton from "./SendButton/SendButton";
import VoiceButton from "./VoiceButton/VoiceButton";
import { isDesktop } from "../../services/Utils";
import { useBotOptions } from "../../context/BotOptionsContext";

import "./ChatBotInput.css";
import { Flow } from "../../types/Flow";

/**
 * Contains chat input field for user to enter messages.
 * 
 * @param inputRef reference to the textarea
 * @param textAreaDisabled boolean indicating if textarea is disabled
 * @param textAreaSensitveMode boolean indicating is textarea is in sensitve mode
 * @param voiceToggledOn boolean indicating if voice is toggled on
 * @param getCurrPath retrieves the current path of user
 * @param handleToggleVoice handles toggling of voice
 * @param handleActionInput handles action input from user 
 */
const ChatBotInput = ({
	inputRef,
	textAreaDisabled,
	textAreaSensitiveMode,
	voiceToggledOn,
	getCurrPath,
	handleToggleVoice,
	handleActionInput,
}: {
	inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>;
	textAreaDisabled: boolean;
	textAreaSensitiveMode: boolean;
	voiceToggledOn: boolean;
	getCurrPath: () => keyof Flow | null;
	handleToggleVoice: () => void;
	handleActionInput: (path: keyof Flow, userInput: string, sendUserInput?: boolean) => Promise<void>;
}) => {

	// handles options for bot
	const { botOptions } = useBotOptions();

	// tracks if chat input is focused
	const [isFocused, setIsFocused] = useState<boolean>(false);

	// tracks length of input
	const [inputLength, setInputLength] = useState<number>(0);

	// serves as a workaround (together with useEffect hook) for sending voice input, can consider a better approach
	const [voiceInputTrigger, setVoiceInputTrigger] = useState<boolean>(false);
	useEffect(() => {
		const currPath = getCurrPath();
		if (!currPath) {
			return;
		}
		handleActionInput(currPath, inputRef.current?.value as string);
		setInputLength(0);
	}, [voiceInputTrigger])

	// styles for text area
	const textAreaStyle: React.CSSProperties = {
		boxSizing: isDesktop ? "content-box" : "border-box",
		...botOptions.chatInputAreaStyle,
	};

	// styles for focused text area
	const textAreaFocusedStyle: React.CSSProperties = {
		outline: !textAreaDisabled ? "none" : "",
		boxShadow: !textAreaDisabled ? `0 0 5px ${botOptions.theme?.primaryColor}` : "",
		boxSizing: isDesktop ? "content-box" : "border-box",
		...botOptions.chatInputAreaStyle, // by default inherit the base style for input area
		...botOptions.chatInputAreaFocusedStyle,
	};

	// styles for disabled text area
	const textAreaDisabledStyle: React.CSSProperties = {
		cursor: `url(${botOptions.theme?.actionDisabledIcon}), auto`,
		caretColor: "transparent",
		boxSizing: isDesktop ? "content-box" : "border-box",
		...botOptions.chatInputAreaStyle, // by default inherit the base style for input area
		...botOptions.chatInputAreaDisabledStyle,
	};

	// styles for character limit
	const characterLimitStyle: React.CSSProperties = {
		color: "#989898",
		...botOptions.characterLimitStyle
	};

	// styles for character limit reached
	const characterLimitReachedStyle: React.CSSProperties = {
		color: "#ff0000",
		...botOptions.characterLimitReachedStyle
	};

	// styles for input placeholder
	const placeholder = textAreaDisabled
		? botOptions.chatInput?.disabledPlaceholderText
		: botOptions.chatInput?.enabledPlaceholderText;

	/**
	 * Handles focus event on chat input.
	 */
	const handleFocus = () => {
		if (textAreaDisabled) {
			return;
		}
		setIsFocused(true);
	};

	/**
	 * Handles blur event on chat input.
	 */
	const handleBlur = () => {
		setIsFocused(false);
	};

	/**
	 * Handles keyboard events and proceeds to submit user input if enter button is pressed.
	 * 
	 * @param event keyboard event
	 */ 
	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSubmit(event);
		}
	};

	/**
	 * Handles textarea value changes.
	 * 
	 * @param event textarea change event
	 */
	const handleTextareaValueChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
		if (textAreaDisabled && inputRef.current) {
			// prevent input and keep current value
			inputRef.current.value = "";
			return;
		}

		if (inputRef.current) {
			const characterLimit = botOptions.chatInput?.characterLimit
			const newInput = event.target.value.replace(/\n/g, " ");
			if (characterLimit != null && characterLimit >= 0 && newInput.length > characterLimit) {
				inputRef.current.value = newInput.slice(0, characterLimit);
			} else {
				inputRef.current.value = newInput
			}
			setInputLength(inputRef.current.value.length);
		}
	};

	/**
	 * Handles submission of user input via enter key or send button.
	 * 
	 * @param event form event or mouse event
	 */
	const handleSubmit = (event: (FormEvent | MouseEvent)) => {
		event.preventDefault();
		const currPath = getCurrPath();
		if (!currPath) {
			return;
		}
		handleActionInput(currPath, inputRef.current?.value as string);
		setInputLength(0);
	};

	/**
	 * Handles submission of user voice input.
	 */
	const triggerSendVoiceInput = () => {
		setVoiceInputTrigger(prev => !prev);
	}

	return (
		<div 
			onMouseDown={(event: MouseEvent) => {
				event.stopPropagation();
			}}
			style={botOptions.chatInputContainerStyle} 
			className="rcb-chat-input"
		>
			{/* textarea intentionally does not use the disabled property to prevent keyboard from closing on mobile */}
			{textAreaSensitiveMode && botOptions.sensitiveInput?.maskInTextArea ?
				<input
					ref={inputRef as RefObject<HTMLInputElement>}
					type="password"
					className="rcb-chat-input-textarea"
					style={textAreaDisabled
						? textAreaDisabledStyle
						: (isFocused ? textAreaFocusedStyle : textAreaStyle)}
					placeholder={placeholder}
					onChange={handleTextareaValueChange}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
					onBlur={handleBlur}
				/>
				:
				<textarea
					ref={inputRef as RefObject<HTMLTextAreaElement>}
					style={textAreaDisabled
						? textAreaDisabledStyle
						: (isFocused ? textAreaFocusedStyle : textAreaStyle)}
					rows={1}
					className="rcb-chat-input-textarea"
					placeholder={placeholder}
					onChange={handleTextareaValueChange}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
					onBlur={handleBlur}
				/>
			}
			<div className="rcb-chat-input-button-container">
				{!botOptions.voice?.disabled && isDesktop &&
					<VoiceButton inputRef={inputRef} textAreaDisabled={textAreaDisabled}
						voiceToggledOn={voiceToggledOn} handleToggleVoice={handleToggleVoice}
						triggerSendVoiceInput={triggerSendVoiceInput} setInputLength={setInputLength}
					/>
				}
				<SendButton handleSubmit={handleSubmit}/>
				{botOptions.chatInput?.showCharacterCount
					&& botOptions.chatInput?.characterLimit != null
					&& botOptions.chatInput?.characterLimit > 0
					&&
					<div 
						className="rcb-chat-input-char-counter"
						style={inputLength >= botOptions.chatInput?.characterLimit
							? characterLimitReachedStyle
							: characterLimitStyle
						}
					>
						{inputLength}/{botOptions.chatInput?.characterLimit}
					</div>
				}
			</div>
		</div>
	);
};

export default ChatBotInput;